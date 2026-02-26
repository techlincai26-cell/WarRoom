const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function loadQuestionMap() {
  const stagesDir = path.join(__dirname, '..', 'src', 'lib', 'data', 'stages')
  const files = fs.readdirSync(stagesDir)
  const map = new Map()
  for (const f of files) {
    if (!f.endsWith('.json')) continue
    const json = JSON.parse(fs.readFileSync(path.join(stagesDir, f), 'utf8'))
    if (!json.questions) continue
    for (const q of json.questions) {
      map.set(q.id, q)
    }
  }
  return map
}

function renderAnswerText(resp, qDef) {
  const rd = resp.responseData || {}
  // Common shapes
  if (rd.value && typeof rd.value === 'string') return rd.value
  if (rd.text && typeof rd.text === 'string') return rd.text
  if (rd.selectedOptionId && qDef && qDef.options) {
    const opt = qDef.options.find(o => o.id === rd.selectedOptionId)
    return opt ? opt.text : rd.selectedOptionId
  }
  // Fallback to JSON
  try { return JSON.stringify(rd) } catch (e) { return String(rd) }
}

async function generate(assessmentId) {
  const qMap = await loadQuestionMap()

  const stages = await prisma.stage.findMany({ where: { assessmentId }, orderBy: { stageNumber: 'asc' } })
  if (!stages || stages.length === 0) {
    console.error('No stages found for assessment', assessmentId)
    process.exit(1)
  }

  let out = `# Assessment ${assessmentId}\n\n`

  for (const s of stages) {
    out += `## Stage ${s.stageNumber}: ${s.stageName}\n\n`
    const responses = await prisma.response.findMany({ where: { assessmentId, stageId: s.id }, orderBy: { answeredAt: 'asc' } })
    if (!responses || responses.length === 0) {
      out += `_No responses recorded for this stage._\n\n`
      continue
    }

    for (const r of responses) {
      const q = qMap.get(r.questionId)
      const qText = q ? q.questionText : (r.responseData && r.responseData._questionText) || r.questionId
      const answer = renderAnswerText(r, q)
      out += `- **Q (${r.questionId})**: ${qText}\n  - **Answer:** ${answer}\n\n`
    }
  }

  const outPath = path.join(__dirname, '..', `assessment-${assessmentId}-qa.md`)
  fs.writeFileSync(outPath, out, 'utf8')
  console.log('Wrote', outPath)
}

if (require.main === module) {
  const id = process.argv[2]
  if (!id) {
    console.error('Usage: node generate-stage-qa.js <assessmentId>')
    process.exit(1)
  }
  generate(id).then(() => prisma.$disconnect()).catch(err => { console.error(err); prisma.$disconnect() })
}
