'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecorderReturn {
    isRecording: boolean
    audioBlob: Blob | null
    recordingTime: number
    maxDuration: number
    isSupported: boolean
    startRecording: () => Promise<void>
    stopRecording: () => void
    resetRecording: () => void
}

export function useAudioRecorder(maxDurationSec: number = 60): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isSupported, setIsSupported] = useState(true)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        // Check if MediaRecorder is supported
        if (typeof window !== 'undefined') {
            setIsSupported(
                !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof window.MediaRecorder !== 'undefined')
            )
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const startRecording = useCallback(async () => {
        try {
            chunksRef.current = []
            setAudioBlob(null)
            setRecordingTime(0)

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            })
            streamRef.current = stream

            // Prefer webm/opus, fallback to webm, then any available
            let mimeType = 'audio/webm;codecs=opus'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm'
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = '' // Let browser pick default
                }
            }

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
                setAudioBlob(blob)
                setIsRecording(false)

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }

                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }

            mediaRecorder.start(250) // Collect data every 250ms
            setIsRecording(true)

            // Start countdown timer
            const startTime = Date.now()
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                setRecordingTime(elapsed)

                // Auto-stop when max duration reached
                if (elapsed >= maxDurationSec) {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop()
                    }
                }
            }, 100)
        } catch (err) {
            console.error('Failed to start recording:', err)
            setIsRecording(false)
        }
    }, [maxDurationSec])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    const resetRecording = useCallback(() => {
        setAudioBlob(null)
        setRecordingTime(0)
        chunksRef.current = []
    }, [])

    return {
        isRecording,
        audioBlob,
        recordingTime,
        maxDuration: maxDurationSec,
        isSupported,
        startRecording,
        stopRecording,
        resetRecording,
    }
}
