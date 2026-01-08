import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Dimensions, FlatList, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { ArrowLeft, RefreshCw, Star, Play, BookOpen, Calculator, Trophy, Lightbulb, XCircle, Home, Volume2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from '../services/VoiceService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width, height } = Dimensions.get('window');

// --- Candy Theme Constants ---
const CANDY_COLORS = {
    pink: ['#FF9AA2', '#FFB7B2'],
    mint: ['#B5EAD7', '#C7F9E2'],
    blue: ['#A0E7E5', '#B4F8C8'],
    purple: ['#E0BBE4', '#957DAD'],
    yellow: ['#FFF6BD', '#FFD700'],
    orange: ['#FFDAC1', '#FF9AA2'],
    error: ['#FF3B30', '#8B0000'],
    success: ['#4CD964', '#2E8B57'],
};

// --- Components ---

const FloatingBubble = ({ startX, startY, size, duration, color }) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -50,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: startY,
                transform: [{ translateY }],
                opacity: 0.6,
                zIndex: -1, // Ensure background stays back
            }}
        >
            <Svg height={size} width={size}>
                <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} fillOpacity="0.5" />
                {/* Shine */}
                <Circle cx={size / 3} cy={size / 3} r={size / 6} fill="white" fillOpacity="0.8" />
            </Svg>
        </Animated.View>
    );
};

const CandyBackground = () => {
    // Generate some static random bubbles
    // In a real app we might memoize or generate on init.
    // For now, fixed set for performance.
    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient
                colors={['#FFF5F5', '#F0F4FF']} // Very subtle candy background
                style={StyleSheet.absoluteFill}
            />
            {/* Floating Elements */}
            <FloatingBubble startX={50} startY={100} size={60} duration={4000} color="#FF9AA2" />
            <FloatingBubble startX={width - 80} startY={200} size={40} duration={6000} color="#B5EAD7" />
            <FloatingBubble startX={100} startY={height - 200} size={80} duration={7000} color="#E0BBE4" />
            <FloatingBubble startX={width / 2} startY={height / 2} size={50} duration={5000} color="#FFF6BD" />
            <FloatingBubble startX={width - 120} startY={height - 100} size={70} duration={8000} color="#A0E7E5" />
        </View>
    );
};

const CandyButton = ({ number, color, onPress, size = 'normal', status = 'neutral', isHinted = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressAnim = useRef(new Animated.Value(0)).current; // 0: unpressed, 1: pressed

    const isLarge = size === 'large';
    const boxSize = isLarge ? 140 : 90;
    const fontSize = isLarge ? 70 : 32;

    // Design:
    // Base Color (Shadow)
    // Main Solid Color
    // 3D Press Effect: move Main Body DOWN by some pixels.

    let mainColor = CANDY_COLORS.blue[0];
    let baseColor = '#5FB7B5'; // Darker blue default

    // Map 'color' prop to candy palette roughly
    if (color === COLORS.numbersBtn) { mainColor = CANDY_COLORS.pink[0]; baseColor = '#D46A72'; }
    else if (color === COLORS.alphabetBtn) { mainColor = CANDY_COLORS.purple[0]; baseColor = '#6A4C82'; }
    else if (color === COLORS.electricBlue) { mainColor = CANDY_COLORS.blue[0]; baseColor = '#5FA7A5'; }

    // Override for status
    if (status === 'correct') { mainColor = CANDY_COLORS.success[0]; baseColor = '#1E5B37'; }
    if (status === 'wrong') { mainColor = CANDY_COLORS.error[0]; baseColor = '#5B0000'; }
    if (isHinted && status === 'neutral') { mainColor = CANDY_COLORS.yellow[0]; baseColor = '#C7A000'; }

    const handlePressIn = () => {
        Animated.parallel([
            Animated.timing(pressAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20 })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.timing(pressAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 })
        ]).start();
    };

    // Interpolate translateY for "Press" effect
    const translateY = pressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 6] // Moves down 6px
    });

    const shadowHeight = 8;

    return (
        <View style={{ width: boxSize, height: boxSize + shadowHeight, margin: 10, justifyContent: 'flex-end' }}>
            {/* 3D Base / Shadow */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                height: '100%',
                backgroundColor: baseColor,
                borderRadius: 25,
            }} />

            {/* Main Button Body */}
            <AnimatedPressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={{
                    width: '100%',
                    height: boxSize, // Slightly shorter than container to reveal "shadow" at bottom
                    borderRadius: 25,
                    marginBottom: shadowHeight, // Initial offset up
                    transform: [{ translateY }, { scale: scaleAnim }],
                    zIndex: 10,
                }}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: mainColor,
                        borderRadius: 25,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.4)'
                    }}
                >
                    <Text style={[styles.numberText, { fontSize, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>{number}</Text>
                </View>
            </AnimatedPressable>
        </View>
    );
};

const AbacusBlock = ({ count, color, highlightedCount }) => {
    // Renders a stack of blocks.
    return (
        <View style={[styles.abacusColumn, count === 10 && styles.tenBar, { flexWrap: 'wrap-reverse', maxHeight: 160 }]}>
            {Array.from({ length: count }).map((_, i) => {
                const isHighlighted = i < highlightedCount;
                return (
                    <AnimatedCube
                        key={i}
                        color={color}
                        isHighlighted={isHighlighted}
                    />
                );
            }).reverse()}
        </View>
    );
};

const AnimatedCube = ({ color, isHighlighted }) => {
    // Standard Animated API
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isHighlighted) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 150,
                    useNativeDriver: true
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [isHighlighted]);

    return (
        <Animated.View
            style={[
                styles.abacusCube,
                {
                    borderColor: isHighlighted ? '#FFF' : 'rgba(0,0,0,0.1)',
                    opacity: isHighlighted ? 1 : 0.8,
                    backgroundColor: isHighlighted ? '#FFD700' : color,
                    zIndex: isHighlighted ? 10 : 0,
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        />
    );
};

const VisualAbacus = ({ number, highlightedCount }) => {
    // Logic: Split number into Tens and Ones
    const tens = Math.floor(number / 10);
    const ones = number % 10;

    // Dynamic scaling for large numbers
    const isLarge = number > 40;
    const scale = isLarge ? 0.75 : 1;
    const spacing = isLarge ? 6 : 10;

    return (
        <View style={[styles.abacusContainer, { gap: spacing }]}>
            {/* Render Ten Bars */}
            {Array.from({ length: tens }).map((_, i) => {
                const thisBarThreshold = (i + 1) * 10;
                let litInBar = 0;
                if (highlightedCount >= thisBarThreshold) litInBar = 10;
                else if (highlightedCount > i * 10) litInBar = highlightedCount - (i * 10);

                return (
                    <View key={`ten-${i}`} style={{ transform: [{ scale }] }}>
                        <AbacusBlock count={10} color={COLORS.electricBlue} highlightedCount={litInBar} />
                    </View>
                );
            })}

            {/* Render Ones */}
            {ones > 0 && (
                <View style={{ transform: [{ scale }] }}>
                    <AbacusBlock
                        count={ones}
                        color={COLORS.numbersBtn}
                        highlightedCount={Math.max(0, highlightedCount - (tens * 10))}
                    />
                </View>
            )}
        </View>
    );
};

const NumberCard = ({ number, params, onPress, isHighlighted }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current; // For Heartbeat

    const colors = [CANDY_COLORS.orange[0], CANDY_COLORS.success[0], CANDY_COLORS.blue[0]];
    const colorIndex = number % 3;
    const itemColor = colors[colorIndex];

    useEffect(() => {
        if (isHighlighted) {
            // Heartbeat Effect
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
                    Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true })
                ])
            ).start();
        } else {
            scaleAnim.stopAnimation();
            scaleAnim.setValue(1);
        }
        return () => scaleAnim.stopAnimation();
    }, [isHighlighted]);

    return (
        <View style={{ width: 90, height: 90, margin: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable onPress={onPress} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                    style={{
                        width: 80,
                        height: 80,
                        backgroundColor: itemColor,
                        borderRadius: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        // Shadow for 3D token look
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 4,
                        // Border Highlight
                        borderWidth: isHighlighted ? 3 : 0,
                        borderColor: '#FFF',
                        transform: [{ scale: scaleAnim }],
                        overflow: 'hidden'
                    }}
                >
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFF' }}>{number}</Text>
                </Animated.View>
            </Pressable>
        </View>
    );
};

const ProgressBar = ({ current, total }) => {
    const widthPercent = (current / total) * 100 + '%';
    return (
        <View style={{ width: '80%', height: 12, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 6, marginVertical: 20, overflow: 'hidden' }}>
            <View style={{ width: widthPercent, height: '100%', backgroundColor: COLORS.success, borderRadius: 6 }} />
        </View>
    );
};

const MenuButton = ({ title, icon: Icon, color, onPress, subTitle, style }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

    return (
        <View style={[styles.menuButtonContainer, style]}>
            <View style={[styles.menuButtonShadow, { backgroundColor: shadeColor(color, -20) }]} />
            <AnimatedPressable
                style={[styles.menuButtonTop, { backgroundColor: color, transform: [{ scale: scaleAnim }] }]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View style={styles.menuIconCircle}>
                    <Icon color={color} size={32} strokeWidth={2.5} />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={styles.menuButtonText}>{title}</Text>
                    {subTitle && <Text style={styles.menuButtonSubText}>{subTitle}</Text>}
                </View>
            </AnimatedPressable>
        </View>
    );
};

// Helper to darken color for shadow
function shadeColor(color, percent) {
    // Simple placeholder or use a fixed mapping if strict.
    // For now assuming solid hex input or mapping manually.
    // Since we have CANDY_COLORS, we can just map simple darker variants if passed standard colors.
    // But to be safe and simple, let's use a standard dark/shadow color or fixed map.
    const map = {
        [CANDY_COLORS.numbersBtn]: '#D46A72',
        [CANDY_COLORS.alphabetBtn]: '#6A4C82',
        [CANDY_COLORS.electricBlue]: '#5FA7A5',
        [CANDY_COLORS.pink[0]]: '#D46A72',
        [CANDY_COLORS.purple[0]]: '#6A4C82',
        [CANDY_COLORS.blue[0]]: '#5FA7A5',
        [CANDY_COLORS.orange[0]]: '#C88A50',
        [CANDY_COLORS.mint[0]]: '#6ABF98',
    };
    return map[color] || 'rgba(0,0,0,0.2)';
}

export default function NumbersScreen({ navigation }) {
    const [mode, setMode] = useState('menu');
    const [learnStage, setLearnStage] = useState(1); // 1: 0-10, 2: 10-20, 3: Tens
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [highlightedCount, setHighlightedCount] = useState(0);

    // Game Logic
    const [difficulty, setDifficulty] = useState('easy');
    const [question, setQuestion] = useState(null);
    const [message, setMessage] = useState('');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [answerStatus, setAnswerStatus] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [isQuestionVisible, setIsQuestionVisible] = useState(true);

    // Animations
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const countingTimeout = useRef(null);
    const isFocusedRef = useRef(true);

    // Persistence & Cleanup
    useFocusEffect(
        useCallback(() => {
            // Screen Focused / Mounted
            isFocusedRef.current = true;
            return () => {
                // Screen Blurred / Unmounted
                isFocusedRef.current = false;
                VoiceService.stop();
                if (countingTimeout.current) {
                    clearTimeout(countingTimeout.current);
                    countingTimeout.current = null;
                }
                setHighlightedCount(0);
            };
        }, [])
    );

    useEffect(() => {
        loadHighScore();
        loadVisited();
    }, []);

    const [visitedNumbers, setVisitedNumbers] = useState([]); // Array of numbers

    const loadVisited = async () => {
        try {
            const stored = await AsyncStorage.getItem('VISITED_NUMBERS');
            if (stored) setVisitedNumbers(JSON.parse(stored));
        } catch (e) { console.log('Failed load visited'); }
    };

    const markVisited = async (num) => {
        if (!visitedNumbers.includes(num)) {
            const newVisited = [...visitedNumbers, num];
            setVisitedNumbers(newVisited);
            await AsyncStorage.setItem('VISITED_NUMBERS', JSON.stringify(newVisited));
        }
    };

    const isStageComplete = (stage) => {
        let range = [];
        if (stage === 1) range = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (stage === 2) range = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        if (stage === 3) range = [20, 30, 40, 50, 60, 70, 80, 90, 100];
        return range.every(r => visitedNumbers.includes(r));
    };

    const loadHighScore = async () => {
        try {
            const stored = await AsyncStorage.getItem('HIGH_SCORE_NUMBERS');
            if (stored) setHighScore(parseInt(stored));
        } catch (e) {
            console.log('Failed to load high score');
        }
    };

    const saveHighScore = async (newScore) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem('HIGH_SCORE_NUMBERS', newScore.toString());
                return true; // New record
            }
        } catch (e) {
            console.log('Failed to save high score');
        }
        return false;
    };

    // Timer
    useEffect(() => {
        let interval = null;
        if (mode === 'game' && timeLeft > 0) {
            if (timeLeft <= 3) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (mode === 'game' && timeLeft === 0) {
            VoiceService.speak('Süre bitti!');
            endGame();
        }
        return () => clearInterval(interval);
    }, [mode, timeLeft]);

    const startGame = (diff) => {
        setDifficulty(diff);
        setScore(0);
        setTimeLeft(diff === 'easy' ? 45 : 30);
        setMode('game');
        setShowConfetti(false);
        generateQuestion(diff);
    };

    const endGame = async () => {
        const isNewRecord = await saveHighScore(score);
        if (isNewRecord) {
            setShowConfetti(true);
            setMessage('NEW RECORD! 🏆');
            VoiceService.speak('Vay canına! Yeni rekor!');
        } else {
            setMessage('Game Over!');
        }
        setMode('game_over');
    };

    const generateQuestion = (currentDiff = difficulty) => {
        setAnswerStatus({});
        setHintUsed(false);
        setIsQuestionVisible(true);

        const min = currentDiff === 'easy' ? 0 : 10;
        const max = currentDiff === 'easy' ? 9 : 20;

        const target = Math.floor(Math.random() * (max - min + 1)) + min;
        const options = [target];

        while (options.length < 4) {
            const r = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!options.includes(r)) options.push(r);
        }
        options.sort(() => Math.random() - 0.5);

        setQuestion({ target, options });
        setMessage(''); // Clear visual message for Voice-Only mode
        VoiceService.announceTask(target);
    };

    const handleReplay = () => {
        if (!question) return;
        const targetWord = VoiceService.getNumberWord(question.target);
        VoiceService.speak(`${targetWord} nerede acaba?`);
    };

    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleGameAnswer = (ans) => {
        if (mode !== 'game') return;

        if (ans === question.target) {
            // Correct
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAnswerStatus({ ...answerStatus, [ans]: 'correct' });
            setMessage('Yay! 🎉');

            if (!hintUsed) {
                setScore(s => s + 1);
            }

            setTimeout(() => {
                generateQuestion();
            }, 800);
        } else {
            // Wrong
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerShake();

            setAnswerStatus({ ...answerStatus, [ans]: 'wrong' });
            setMessage('Opps! 🙈');
            VoiceService.speak('Hoppala! Bir daha dene bakalım!');
            setScore(s => Math.max(0, s - 1));

            setIsQuestionVisible(false);

            setTimeout(() => {
                setIsQuestionVisible(true);
                setMessage('');
                setAnswerStatus(prev => {
                    const newState = { ...prev };
                    delete newState[ans];
                    return newState;
                });
            }, 2000);
        }
    };

    const useHint = () => {
        if (hintUsed || score === 0) return;
        setScore(s => Math.max(0, s - 1));
        setHintUsed(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const targetWord = VoiceService.getNumberWord(question.target);
        VoiceService.speak(`İşte sana bir ipucu! ${targetWord} nerede acaba?`);
    };

    // --- Render Sections ---

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <MenuButton
                title="Learn Numbers"
                subTitle="Explore 0 - 100"
                icon={BookOpen}
                color="#FF4081" // Vibrant Magenta
                onPress={() => setMode('stages')}
            />
            <MenuButton
                title="Number Game"
                subTitle={`High Score: ${highScore}`}
                icon={Trophy}
                color="#00E5FF" // Vibrant Cyan
                onPress={() => setMode('difficulty_select')}
            />
            <MenuButton
                title="Math Fun"
                subTitle="+ - = ?"
                icon={Calculator}
                color="#FFD600" // Vibrant Yellow
                onPress={() => setMode('math')}
            />
        </View>
    );

    const renderStages = () => (
        <View style={styles.centerContainer}>
            <Text style={[styles.title, { marginBottom: 30 }]}>Select Stage</Text>
            <View style={{ gap: 20 }}>
                <MenuButton
                    title="Stage 1"
                    subTitle={isStageComplete(1) ? "Completed! ⭐" : "0 - 9"}
                    icon={Star}
                    color={COLORS.numbersBtn}
                    style={isStageComplete(1) ? { borderColor: '#FFD700', borderWidth: 2 } : {}}
                    onPress={() => { setLearnStage(1); setMode('grid'); }}
                />
                <MenuButton
                    title="Stage 2"
                    subTitle={isStageComplete(2) ? "Completed! ⭐" : "10 - 20"}
                    icon={Star}
                    color={COLORS.electricBlue}
                    style={isStageComplete(2) ? { borderColor: '#FFD700', borderWidth: 2 } : {}}
                    onPress={() => { setLearnStage(2); setMode('grid'); }}
                />
                <MenuButton
                    title="Stage 3"
                    subTitle={isStageComplete(3) ? "Completed! ⭐" : "Tens (20-100)"}
                    icon={Star}
                    color={COLORS.alphabetBtn}
                    style={isStageComplete(3) ? { borderColor: '#FFD700', borderWidth: 2 } : {}}
                    onPress={() => { setLearnStage(3); setMode('grid'); }}
                />
            </View>
        </View>
    );

    const getStageNumbers = () => {
        if (learnStage === 1) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (learnStage === 2) return [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        if (learnStage === 3) return [20, 30, 40, 50, 60, 70, 80, 90, 100];
        return [];
    };

    const playCountingSequence = async (num) => {
        setHighlightedCount(0);
        VoiceService.stop();

        const speakStep = (current, limit) => {
            if (!isFocusedRef.current) return;
            if (current > limit) return;

            setHighlightedCount(current);
            let word = VoiceService.getNumberWord(current);
            word = word.charAt(0).toUpperCase() + word.slice(1);

            VoiceService.speak(word, {
                queue: true,
                onStart: () => { },
                onDone: () => {
                    if (!isFocusedRef.current) return;
                    countingTimeout.current = setTimeout(() => {
                        if (!isFocusedRef.current) return;
                        const step = (learnStage === 3) ? 10 : 1;
                        speakStep(current + step, limit);
                    }, 300);
                }
            });
        };

        let start = 1;
        if (learnStage === 3) start = 10;
        else if (num > 10) start = 10;

        if (isFocusedRef.current) {
            speakStep(start, num);
        }
    };

    const renderGridItem = ({ item }) => (
        <NumberCard
            number={item}
            color={item % 2 === 0 ? COLORS.numbersBtn : COLORS.electricBlue}
            isHighlighted={highlightedCount === item} // Simple pulse for now, or match logic
            onPress={() => {
                setSelectedNumber(item);
                setMode('detail');
                markVisited(item);
                playCountingSequence(item);
            }}
        />
    );

    const renderGrid = () => {
        const stageNums = getStageNumbers();
        const visitedCount = stageNums.filter(n => visitedNumbers.includes(n)).length;

        return (
            <View style={styles.gridContainer}>
                <ProgressBar current={visitedCount} total={stageNums.length} />
                <Text style={styles.instructions}>Tap a number!</Text>

                <FlatList
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    data={stageNums}
                    renderItem={renderGridItem}
                    keyExtractor={(item) => item.toString()}
                    numColumns={3}
                    showsVerticalScrollIndicator={false}
                    columnWrapperStyle={{ justifyContent: 'space-around', gap: 10 }}
                />
            </View>
        );
    };

    const renderDetail = () => (
        <View style={[styles.centerContainer, { justifyContent: 'flex-start', paddingTop: 20 }]}>
            <View style={{ alignItems: 'center', gap: 20, marginBottom: 40, width: '100%' }}>
                <CandyButton number={selectedNumber} color={COLORS.numbersBtn} size="large" onPress={() => { playCountingSequence(selectedNumber); }} />
                <VisualAbacus number={selectedNumber} highlightedCount={highlightedCount} />
            </View>

            <Pressable onPress={() => playCountingSequence(selectedNumber)} style={styles.replayButtonDetail}>
                <RefreshCw color="#FFF" size={24} />
                <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 10, fontSize: 18 }}>Count Again</Text>
            </Pressable>
        </View>
    );

    const renderDifficultySelect = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.title}>Select Difficulty</Text>
            <View style={{ gap: 20, marginTop: 30 }}>
                <Pressable
                    style={[styles.diffButton, { backgroundColor: COLORS.alphabetBtn }]}
                    onPress={() => startGame('easy')}
                >
                    <Text style={styles.diffText}>Easy (45s)</Text>
                    <Text style={styles.diffSubText}>Numbers 0-9</Text>
                </Pressable>
                <Pressable
                    style={[styles.diffButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => startGame('hard')}
                >
                    <Text style={styles.diffText}>Hard (30s)</Text>
                    <Text style={styles.diffSubText}>Numbers 10-20</Text>
                </Pressable>
            </View>
        </View>
    );

    const renderGame = () => (
        <View style={styles.randomContainer}>
            <View style={styles.statsBar}>
                <View style={styles.statBox}>
                    <Star color={COLORS.numbersBtn} fill={COLORS.numbersBtn} size={24} />
                    <Text style={styles.statText}>{score}</Text>
                </View>
                <View style={[styles.statBox, { borderColor: timeLeft < 10 ? 'red' : '#ddd' }]}>
                    <Text style={[styles.statText, { color: timeLeft < 10 ? 'red' : COLORS.primaryText }]}>{timeLeft}s</Text>
                </View>
                <Pressable onPress={useHint} style={[styles.statBox, { opacity: (hintUsed || score === 0) ? 0.5 : 1 }]}>
                    <Lightbulb color="#FFD700" fill="#FFD700" size={24} />
                </Pressable>
            </View>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }], alignItems: 'center', marginBottom: 20 }}>
                <Pressable
                    onPress={handleReplay}
                    style={({ pressed }) => ({
                        backgroundColor: COLORS.electricBlue,
                        padding: 20,
                        borderRadius: 50,
                        opacity: pressed ? 0.8 : 1,
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                        transform: [{ scale: pressed ? 0.95 : 1 }]
                    })}
                >
                    <Volume2 color="#FFF" size={60} strokeWidth={2.5} />
                </Pressable>
                <Text style={{ marginTop: 10, color: COLORS.primaryText, fontSize: 18, fontWeight: '600' }}>Tekrar Dinle</Text>
            </Animated.View>

            <View style={styles.optionsGrid}>
                {question && question.options.map((num, i) => (
                    <CandyButton
                        key={i}
                        number={num}
                        color={COLORS.electricBlue}
                        status={answerStatus[num]}
                        isHinted={hintUsed && num === question.target}
                        onPress={() => handleGameAnswer(num)}
                    />
                ))}
            </View>
        </View>
    );

    const renderGameOver = () => (
        <View style={styles.centerContainer}>
            {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
            <Text style={styles.title}>{message}</Text>
            <View style={styles.finalScoreBox}>
                <Text style={styles.finalScoreLabel}>Final Score</Text>
                <Text style={styles.finalScoreValue}>{score}</Text>
            </View>
            <Text style={styles.highScoreText}>High Score: {highScore}</Text>

            <View style={{ gap: 20, width: '100%', alignItems: 'center' }}>
                <MenuButton
                    title="Play Again"
                    icon={RefreshCw}
                    color={COLORS.electricBlue}
                    onPress={() => setMode('difficulty_select')}
                    style={{ width: 280 }}
                />
                <MenuButton
                    title="Main Menu"
                    icon={Home}
                    color={COLORS.numbersBtn}
                    onPress={() => setMode('menu')}
                    style={{ width: 280 }}
                />
            </View>
        </View>
    );

    const renderMath = () => (
        <View style={styles.centerContainer}>
            <Calculator color={COLORS.electricBlue} size={80} />
            <Text style={[styles.detailText, { marginTop: 20 }]}>Math Fun</Text>
            <Text style={styles.subText}>Coming Soon!</Text>
        </View>
    );

    const handleBack = () => {
        // Strict Cleanup on Back
        VoiceService.stop();
        if (countingTimeout.current) {
            clearTimeout(countingTimeout.current);
            countingTimeout.current = null;
        }
        setHighlightedCount(0);

        if (mode === 'menu') navigation.goBack();
        else if (mode === 'stages') setMode('menu');
        else if (mode === 'grid') setMode('stages');
        else if (mode === 'detail') setMode('grid');
        else if (mode === 'game') {
            setMode('difficulty_select');
        }
        else if (mode === 'game_over') setMode('menu');
        else if (mode === 'difficulty_select') setMode('menu');
        else if (mode === 'detail') setMode('grid');
        else setMode('menu');
    };

    const getTitle = () => {
        switch (mode) {
            case 'menu': return 'Numbers';
            case 'stages': return 'Stages';
            case 'grid': return `Stage ${learnStage}`;
            case 'detail': return 'Learn';
            case 'difficulty_select': return 'Play';
            case 'game': return 'Playing...';
            case 'game_over': return 'Finished';
            case 'math': return 'Math Fun';
            default: return 'Numbers';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <CandyBackground />

            {/* Header */}
            <View style={styles.headerRow}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <ArrowLeft color={COLORS.primaryText} size={32} />
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{getTitle()}</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                {mode === 'menu' && renderMenu()}
                {mode === 'stages' && renderStages()}
                {mode === 'grid' && renderGrid()}
                {mode === 'detail' && renderDetail()}
                {mode === 'difficulty_select' && renderDifficultySelect()}
                {mode === 'game' && renderGame()}
                {mode === 'game_over' && renderGameOver()}
                {mode === 'math' && renderMath()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' }, // Transparent to show gradient
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryText, marginLeft: 5 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.numbersBtn },
    content: { flex: 1 },

    // Menu
    menuContainer: { flex: 1, padding: 20, gap: 20, justifyContent: 'center', alignItems: 'center' },
    menuButtonContainer: { width: '100%', maxWidth: 350, height: 110, marginBottom: 10 },
    menuButtonShadow: { position: 'absolute', bottom: 0, width: '100%', height: '100%', borderRadius: 25 },
    menuButtonTop: { width: '100%', height: 100, borderRadius: 25, flexDirection: 'row', alignItems: 'center', padding: 20 },
    menuIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    menuTextContainer: { flex: 1 },
    menuButtonText: { fontSize: 26, fontWeight: '800', color: COLORS.white },
    menuButtonSubText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

    // Grid
    gridContainer: { flex: 1, alignItems: 'center', width: '100%' },
    gridContent: { paddingBottom: 40, alignItems: 'center', justifyContent: 'center' },
    instructions: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 20, marginTop: 10 },

    numberText: { fontWeight: '900', color: '#FFF' },

    // Abacus
    abacusContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexWrap: 'wrap', // Allow wrapping for large numbers
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 20
    },
    abacusColumn: { padding: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', gap: 4, justifyContent: 'flex-end' },
    tenBar: { borderBottomWidth: 4, borderColor: 'rgba(0,0,0,0.1)' },
    abacusCube: { width: 30, height: 30, borderRadius: 6, borderWidth: 1 },

    // Detail / Math / Diff / GameOver
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    replayButtonDetail: { flexDirection: 'row', backgroundColor: COLORS.electricBlue, padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 30, elevation: 5 },
    detailText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primaryText, marginTop: 40 },
    title: { fontSize: 36, fontWeight: '900', color: COLORS.primaryText, textAlign: 'center' },
    subText: { fontSize: 20, color: COLORS.primaryText, opacity: 0.6, marginTop: 10 },

    // Difficulty
    diffButton: { width: 220, paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', elevation: 5 },
    diffText: { color: COLORS.white, fontSize: 28, fontWeight: '800' },
    diffSubText: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600', marginTop: 5 },

    // Game
    randomContainer: { flex: 1, alignItems: 'center', padding: 20 },
    statsBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 350, marginBottom: 40 },
    statBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, shadowOpacity: 0.1, borderWidth: 2, borderColor: '#eee' },
    statText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryText, marginLeft: 5 },

    bigQuestion: { fontSize: 40, fontWeight: '900', color: COLORS.primaryText, marginBottom: 40, textAlign: 'center', height: 50 },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, justifyContent: 'center' },

    // Game Over
    finalScoreBox: { backgroundColor: COLORS.numbersBtn, padding: 30, borderRadius: 30, alignItems: 'center', marginVertical: 30, elevation: 5 },
    finalScoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: 'bold' },
    finalScoreValue: { color: COLORS.white, fontSize: 60, fontWeight: '900' },
    highScoreText: { color: COLORS.primaryText, fontSize: 18, fontWeight: '600', marginBottom: 30 },
    replayButton: { flexDirection: 'row', backgroundColor: COLORS.electricBlue, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, alignItems: 'center', elevation: 5 },
    replayText: { color: COLORS.white, fontSize: 22, fontWeight: 'bold', marginLeft: 10 },
    homeButton: { marginTop: 20, padding: 10 },
    homeButtonText: { color: COLORS.primaryText, fontSize: 16, fontWeight: 'bold', textDecorationLine: 'underline' }
});
