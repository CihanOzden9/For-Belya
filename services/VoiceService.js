import * as Speech from 'expo-speech';

const NUMBER_WORDS = [
    'sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz',
    'on', 'on bir', 'on iki', 'on üç', 'on dört', 'on beş', 'on altı', 'on yedi', 'on sekiz', 'on dokuz', 'yirmi'
];

const TENS = {
    10: 'on', 20: 'yirmi', 30: 'otuz', 40: 'kırk', 50: 'elli',
    60: 'altmış', 70: 'yetmiş', 80: 'seksen', 90: 'doksan', 100: 'yüz'
};

class VoiceService {
    constructor() {
        this.pitch = 1.4;
        this.rate = 1.2;
        this.language = 'tr-TR';
        this.isSpeaking = false;
        this._timeout = null;
    }

    speak(text, options = {}) {
        // Stop any current speech and clear pending timeouts
        if (!options.queue) {
            Speech.stop();
            if (this._timeout) clearTimeout(this._timeout);
        }
        this.isSpeaking = false;

        // Small delay to allow cleanup/init
        this._timeout = setTimeout(() => {
            Speech.speak(text, {
                language: this.language,
                pitch: this.pitch,
                rate: this.rate,
                onStart: () => {
                    this.isSpeaking = true;
                    if (options.onStart) options.onStart();
                },
                onDone: () => {
                    this.isSpeaking = false;
                    if (options.onDone) options.onDone();
                },
                onStopped: () => {
                    this.isSpeaking = false;
                    if (options.onStopped) options.onStopped();
                },
                onError: (e) => {
                    console.error('Speech error', e);
                    this.isSpeaking = false;
                }
            });
        }, 100);
    }

    announceTask(number) {
        const numWord = this.getNumberWord(number);
        // Natural phrasing: "[X] sayısını bulabilir misin?"
        const message = `${numWord} sayısını bulabilir misin?`;
        this.speak(message);
    }

    getNumberWord(number) {
        // 0-20 directly from array if exists
        if (typeof number === 'number' && number <= 20 && NUMBER_WORDS[number]) return NUMBER_WORDS[number];

        // Check exact tens
        if (TENS[number]) return TENS[number];

        // Construct composite numbers if needed (e.g. 21 -> yirmi bir)
        if (number > 20 && number < 100) {
            const ten = Math.floor(number / 10) * 10;
            const one = number % 10;
            if (TENS[ten] && NUMBER_WORDS[one]) {
                if (one === 0) return TENS[ten];
                return `${TENS[ten]} ${NUMBER_WORDS[one]}`;
            }
        }

        return number.toString();
    }

    stop() {
        if (this._timeout) clearTimeout(this._timeout);
        Speech.stop();
        this.isSpeaking = false;
    }
}

export default new VoiceService();
