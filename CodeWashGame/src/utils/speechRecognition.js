export const getSpeechRecognitionConstructor = (environment = globalThis) =>
    environment.SpeechRecognition || environment.webkitSpeechRecognition || null;

export const isSpeechRecognitionSupported = (environment = globalThis) =>
    getSpeechRecognitionConstructor(environment) !== null;

export const createSpeechRecognition = (factory = getSpeechRecognitionConstructor()) =>
    factory ? new factory() : null;
