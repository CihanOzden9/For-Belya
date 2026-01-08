import * as Speech from 'expo-speech';

const NUMBER_WORDS = [
    'sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz',
    'on', 'on bir', 'on iki', 'on üç', 'on dört', 'on beş', 'on altı', 'on yedi', 'on sekiz', 'on dokuz', 'yirmi'
];

class VoiceService {
    constructor() {
        this.pitch = 1.4;
        this.rate = 1.25;
        this.language = 'tr-TR';
        this.isSpeaking = false;
        this._timeout = null;
    }

    speak(text) {
        // Stop any current speech and clear pending timeouts
        Speech.stop();
        if (this._timeout) clearTimeout(this._timeout);
        this.isSpeaking = false;

        // Small delay to allow cleanup/init
        this._timeout = setTimeout(() => {
            Speech.speak(text, {
                language: this.language,
                pitch: this.pitch,
                rate: this.rate,
                onStart: () => {
                    this.isSpeaking = true;
                },
                onDone: () => {
                    this.isSpeaking = false;
                },
                onStopped: () => {
                    this.isSpeaking = false;
                },
                onError: (e) => {
                    console.error('Speech error', e);
                    this.isSpeaking = false;
                }
            });
        }, 100);
    }

    announceTask(number) {
        const numWord = NUMBER_WORDS[number] || number;
        // Natural phrasing: "[X] sayısını bulabilir misin?"
        const message = `${numWord} sayısını bulabilir misin?`;
        this.speak(message);
    }

    getNumberWord(number) {
        return NUMBER_WORDS[number] || number;
    }

    stop() {
        if (this._timeout) clearTimeout(this._timeout);
        Speech.stop();
        this.isSpeaking = false;
    }
}

export default new VoiceService();

