import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ScrollView, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { ArrowLeft, RefreshCw, Star, Play, BookOpen, Calculator, Trophy, Lightbulb, XCircle, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width } = Dimensions.get('window');

const NumberButton = ({ number, color, onPress, size = 'normal', status = 'neutral', isHinted = false }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    let backgroundColor = color;
    let borderColor = 'rgba(0,0,0,0.1)';
    let borderWidth = size === 'large' ? 10 : 6;

    if (status === 'correct') backgroundColor = '#4CD964'; // Success Green
    if (status === 'wrong') {
        backgroundColor = '#FF3B30';   // Error Red
        borderColor = '#8B0000';       // Dark Red Border
        borderWidth = 8;               // Thicker border for error
    }
    if (isHinted && status === 'neutral') backgroundColor = '#FFD700'; // Gold/Yellow for Hint

    const handlePressIn = () => {
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 20 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

    const isLarge = size === 'large';
    const boxSize = isLarge ? 150 : 80;
    const fontSize = isLarge ? 80 : 40;

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.numberBox,
                {
                    backgroundColor,
                    width: boxSize,
                    height: boxSize,
                    borderRadius: isLarge ? 40 : 20,
                    borderBottomWidth: borderWidth,
                    borderColor: borderColor,
                    transform: [{ scale: scaleAnim }],
                    // Glow effect for hint
                    shadowColor: isHinted ? '#FFD700' : '#000',
                    shadowOpacity: isHinted ? 0.8 : 0.2,
                    shadowRadius: isHinted ? 15 : 3,
                    elevation: isHinted ? 10 : 4,
                }
            ]}
        >
            <Text style={[styles.numberText, { fontSize }]}>{number}</Text>
        </AnimatedPressable>
    );
};

const MenuButton = ({ title, icon: Icon, color, onPress, subTitle, style }) => (
    <Pressable
        style={({ pressed }) => [
            styles.menuButton,
            style,
            { backgroundColor: color, transform: [{ scale: pressed ? 0.98 : 1 }] }
        ]}
        onPress={onPress}
    >
        <View style={styles.menuIconCircle}>
            <Icon color={color} size={32} strokeWidth={2.5} />
        </View>
        <View style={styles.menuTextContainer}>
            <Text style={styles.menuButtonText}>{title}</Text>
            {subTitle && <Text style={styles.menuButtonSubText}>{subTitle}</Text>}
        </View>
    </Pressable>
);

export default function NumbersScreen({ navigation }) {
    // Modes: 'menu', 'grid', 'detail', 'difficulty_select', 'game', 'game_over', 'math'
    const [mode, setMode] = useState('menu');
    const [selectedNumber, setSelectedNumber] = useState(null);

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

    // Persistence
    useEffect(() => {
        loadHighScore();
    }, []);

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
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (mode === 'game' && timeLeft === 0) {
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
        setMessage(`Find ${target}?`);
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

            // Points Logic: No points if hint was used
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

            // Set wrong status immediately
            setAnswerStatus({ ...answerStatus, [ans]: 'wrong' });
            setMessage('Opps! 🙈');
            setScore(s => Math.max(0, s - 1));

            // Hide target number logic
            setIsQuestionVisible(false);

            // Reset after 2 seconds
            setTimeout(() => {
                setIsQuestionVisible(true);
                setMessage(`Find ${question.target}?`);
                setAnswerStatus(prev => {
                    const newState = { ...prev };
                    delete newState[ans]; // Clear the red status
                    return newState;
                });
            }, 2000);
        }
    };

    const useHint = () => {
        if (hintUsed || score === 0) return;
        setScore(s => Math.max(0, s - 1)); // Penalty with Floor
        setHintUsed(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // --- Render Sections ---

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <MenuButton title="Learn Numbers" subTitle="Explore 0 - 9" icon={BookOpen} color={COLORS.numbersBtn} onPress={() => setMode('grid')} />
            <MenuButton title="Number Game" subTitle={`High Score: ${highScore}`} icon={Trophy} color={COLORS.alphabetBtn} onPress={() => setMode('difficulty_select')} />
            <MenuButton title="Math Fun" subTitle="+ - = ?" icon={Calculator} color={COLORS.electricBlue} onPress={() => setMode('math')} />
        </View>
    );

    const renderGrid = () => (
        <ScrollView contentContainerStyle={styles.gridContainer}>
            <Text style={styles.instructions}>Tap a number!</Text>
            <View style={styles.grid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <NumberButton
                        key={num} number={num}
                        color={num % 2 === 0 ? COLORS.numbersBtn : COLORS.alphabetBtn}
                        onPress={() => { setSelectedNumber(num); setMode('detail'); }}
                    />
                ))}
            </View>
        </ScrollView>
    );

    const renderDetail = () => (
        <View style={styles.centerContainer}>
            <NumberButton number={selectedNumber} color={COLORS.numbersBtn} size="large" onPress={() => { }} />
            <Text style={styles.detailText}>This is {selectedNumber}!</Text>
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

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                {isQuestionVisible ? (
                    <Text style={styles.bigQuestion}>{message}</Text>
                ) : (
                    <Text style={[styles.bigQuestion, { opacity: 0 }]}>HIDDEN</Text> // Keep layout space or just hide
                )}
            </Animated.View>

            <View style={styles.optionsGrid}>
                {question && question.options.map((num, i) => (
                    <NumberButton
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

    // --- Navigation Helper ---
    const handleBack = () => {
        if (mode === 'menu') navigation.goBack();
        else if (mode === 'game') {
            // Pausing game logic implies just quitting for now
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
            case 'grid': return 'Learn';
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
    container: { flex: 1, backgroundColor: COLORS.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryText, marginLeft: 5 },
    headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.numbersBtn },
    content: { flex: 1 },

    // Menu
    menuContainer: { flex: 1, padding: 20, gap: 20, justifyContent: 'center', alignItems: 'center' },
    menuButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 25, shadowColor: '#000', shadowOffset: { height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4, width: '100%', maxWidth: 350 },
    menuIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    menuTextContainer: { flex: 1 },
    menuButtonText: { fontSize: 26, fontWeight: '800', color: COLORS.white },
    menuButtonSubText: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

    // Grid
    gridContainer: { alignItems: 'center', paddingBottom: 40 },
    instructions: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryText, marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', maxWidth: 350 },
    numberBox: { justifyContent: 'center', alignItems: 'center', margin: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 },
    numberText: { fontWeight: '900', color: COLORS.white },

    // Detail / Math / Diff / GameOver
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
