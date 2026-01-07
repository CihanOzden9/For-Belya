import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { ArrowLeft, RefreshCw, Star, Play, BookOpen, Calculator, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NumberButton = ({ number, color, onPress, size = 'normal', status = 'neutral' }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Dynamic color based on status (correct/wrong)
    let backgroundColor = color;
    if (status === 'correct') backgroundColor = '#4CD964'; // Success Green
    if (status === 'wrong') backgroundColor = '#FF3B30';   // Error Red

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
                    borderBottomWidth: isLarge ? 10 : 6,
                    // If status is not neutral, we might want to change border color too, but opacity logic ensures it looks okay
                    borderColor: 'rgba(0,0,0,0.1)',
                    transform: [{ scale: scaleAnim }]
                }
            ]}
        >
            <Text style={[styles.numberText, { fontSize }]}>{number}</Text>
        </AnimatedPressable>
    );
};

const MenuButton = ({ title, icon: Icon, color, onPress, subTitle }) => (
    <Pressable
        style={({ pressed }) => [
            styles.menuButton,
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
    // Modes: 'menu', 'grid', 'detail', 'difficulty_select', 'game', 'math'
    const [mode, setMode] = useState('menu');
    const [selectedNumber, setSelectedNumber] = useState(null);

    // Game Logic
    const [difficulty, setDifficulty] = useState('easy'); // 'easy' (0-9), 'hard' (10-20)
    const [question, setQuestion] = useState(null);
    const [message, setMessage] = useState('');
    const [score, setScore] = useState(0);
    const [answerStatus, setAnswerStatus] = useState({}); // { [number]: 'correct' | 'wrong' }

    const resetGame = () => {
        setScore(0);
        setAnswerStatus({});
        generateQuestion();
    };

    const generateQuestion = () => {
        setAnswerStatus({});
        const min = difficulty === 'easy' ? 0 : 10;
        const max = difficulty === 'easy' ? 9 : 20;

        const target = Math.floor(Math.random() * (max - min + 1)) + min;
        const options = [target];

        while (options.length < 4) {
            const r = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!options.includes(r)) options.push(r);
        }
        // Shuffle
        options.sort(() => Math.random() - 0.5);

        setQuestion({ target, options });
        setMessage(`Find ${target}?`);
    };

    const handleGameAnswer = (ans) => {
        if (ans === question.target) {
            // Correct
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAnswerStatus({ ...answerStatus, [ans]: 'correct' });
            setMessage('Yay! 🎉');
            setScore(s => s + 1);
            setTimeout(() => {
                generateQuestion();
            }, 1000);
        } else {
            // Wrong
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setAnswerStatus({ ...answerStatus, [ans]: 'wrong' });
            setMessage('Oops! 🙈');
        }
    };

    // --- Render Sections ---

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <MenuButton
                title="Learn Numbers"
                subTitle="Explore 0 - 9"
                icon={BookOpen}
                color={COLORS.numbersBtn}
                onPress={() => setMode('grid')}
            />
            <MenuButton
                title="Number Game"
                subTitle="Fun Quiz!"
                icon={Trophy}
                color={COLORS.alphabetBtn}
                onPress={() => setMode('difficulty_select')}
            />
            <MenuButton
                title="Math Fun"
                subTitle="+ - = ?"
                icon={Calculator}
                color={COLORS.electricBlue}
                onPress={() => setMode('math')}
            />
        </View>
    );

    const renderGrid = () => (
        <ScrollView contentContainerStyle={styles.gridContainer}>
            <Text style={styles.instructions}>Tap a number!</Text>
            <View style={styles.grid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <NumberButton
                        key={num}
                        number={num}
                        color={num % 2 === 0 ? COLORS.numbersBtn : COLORS.alphabetBtn}
                        onPress={() => {
                            setSelectedNumber(num);
                            setMode('detail');
                        }}
                    />
                ))}
            </View>
        </ScrollView>
    );

    const renderDetail = () => (
        <View style={styles.centerContainer}>
            <NumberButton
                number={selectedNumber}
                color={COLORS.numbersBtn}
                size="large"
                onPress={() => { }}
            />
            <Text style={styles.detailText}>This is {selectedNumber}!</Text>
        </View>
    );

    const renderDifficultySelect = () => (
        <View style={styles.centerContainer}>
            <Text style={styles.title}>Select Difficulty</Text>
            <View style={{ gap: 20, marginTop: 30 }}>
                <Pressable
                    style={[styles.diffButton, { backgroundColor: COLORS.alphabetBtn }]}
                    onPress={() => {
                        setDifficulty('easy');
                        setMode('game');
                        setTimeout(() => resetGame(), 100);
                    }}
                >
                    <Text style={styles.diffText}>Easy (0-9)</Text>
                </Pressable>
                <Pressable
                    style={[styles.diffButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => {
                        setDifficulty('hard');
                        setMode('game');
                        setTimeout(() => resetGame(), 100);
                    }}
                >
                    <Text style={styles.diffText}>Hard (10-20)</Text>
                </Pressable>
            </View>
        </View>
    );

    const renderGame = () => (
        <View style={styles.randomContainer}>
            <View style={styles.scoreBoard}>
                <Star color={COLORS.numbersBtn} fill={COLORS.numbersBtn} size={28} />
                <Text style={styles.scoreText}>Score: {score}</Text>
            </View>

            <Text style={styles.bigQuestion}>{message}</Text>

            <View style={styles.optionsGrid}>
                {question && question.options.map((num, i) => (
                    <NumberButton
                        key={i}
                        number={num}
                        color={COLORS.electricBlue}
                        status={answerStatus[num]} // 'correct' | 'wrong' | undefined
                        onPress={() => handleGameAnswer(num)}
                    />
                ))}
            </View>
            <Pressable onPress={() => { setScore(0); generateQuestion(); }} style={styles.resetButton}>
                <RefreshCw size={20} color={COLORS.primaryText} />
                <Text style={{ marginLeft: 8, fontWeight: 'bold', color: COLORS.primaryText }}>Reset</Text>
            </Pressable>
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
        else if (mode === 'detail') setMode('grid');
        else if (mode === 'game') setMode('difficulty_select');
        else setMode('menu');
    };

    const getTitle = () => {
        switch (mode) {
            case 'menu': return 'Numbers';
            case 'grid': return 'Learn';
            case 'detail': return 'Learn';
            case 'difficulty_select': return 'Play';
            case 'game': return difficulty === 'easy' ? 'Easy Mode' : 'Hard Mode';
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
    menuContainer: { flex: 1, padding: 20, gap: 20, justifyContent: 'center' },
    menuButton: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 25, shadowColor: '#000', shadowOffset: { height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 4 },
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

    // Detail / Math / Diff
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    detailText: { fontSize: 32, fontWeight: 'bold', color: COLORS.primaryText, marginTop: 40 },
    title: { fontSize: 30, fontWeight: '900', color: COLORS.primaryText },
    subText: { fontSize: 20, color: COLORS.primaryText, opacity: 0.6, marginTop: 10 },

    // Difficulty
    diffButton: { width: 200, paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', elevation: 5 },
    diffText: { color: COLORS.white, fontSize: 24, fontWeight: '800' },

    // Game
    randomContainer: { flex: 1, alignItems: 'center', padding: 20 },
    scoreBoard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 30, shadowOpacity: 0.1 },
    scoreText: { fontSize: 22, fontWeight: 'bold', color: COLORS.numbersBtn, marginLeft: 10 },
    bigQuestion: { fontSize: 40, fontWeight: '900', color: COLORS.primaryText, marginBottom: 40, textAlign: 'center' },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, justifyContent: 'center' },
    resetButton: { marginTop: 40, flexDirection: 'row', alignItems: 'center', opacity: 0.6 }
});
