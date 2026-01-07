import React, { useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Hash, Type } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const ToyButton = ({ title, icon: Icon, color, borderColor, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 20, bounciness: 10 }),
            Animated.spring(translateAnim, { toValue: 10, useNativeDriver: true, speed: 20, bounciness: 10 }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
            Animated.spring(translateAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }),
        ]).start();
    };

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.buttonWrapper}>
            <Animated.View style={[styles.card, { backgroundColor: color, borderBottomColor: borderColor, transform: [{ scale: scaleAnim }, { translateY: translateAnim }] }]}>
                <View style={styles.iconContainer}>
                    <Icon color={COLORS.white} size={64} strokeWidth={3} />
                </View>
                <Text style={styles.cardText}>{title}</Text>
            </Animated.View>
        </Pressable>
    );
};

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Belya's World</Text>
                    <Text style={styles.subtitle}>Let's Play & Learn!</Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <ToyButton
                        title={`Numbers\nAdventure`}
                        icon={Hash}
                        color={COLORS.numbersBtn}
                        borderColor={COLORS.numbersBtnBorder}
                        onPress={() => {
                            console.log('Navigating to Numbers');
                            navigation.navigate('Numbers');
                        }}
                    />
                    <ToyButton
                        title={`Alphabet\nMagic`}
                        icon={Type}
                        color={COLORS.alphabetBtn}
                        borderColor={COLORS.alphabetBtnBorder}
                        onPress={() => {
                            console.log('Navigating to Alphabet');
                            navigation.navigate('Alphabet');
                        }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    contentContainer: { flex: 1, paddingHorizontal: 20, justifyContent: 'center', paddingBottom: 40 },
    header: { marginBottom: 60, alignItems: 'center' },
    title: { fontSize: 42, fontWeight: '900', color: COLORS.electricBlue, marginBottom: 5, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
    subtitle: { fontSize: 20, color: COLORS.primaryText, fontWeight: '600', opacity: 0.9 },
    buttonsContainer: { gap: 30, alignItems: 'center', width: '100%' },
    buttonWrapper: { width: '100%', maxWidth: 380, height: 180 },
    card: { width: '100%', height: 160, borderRadius: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, borderBottomWidth: 12 },
    iconContainer: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginRight: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    cardText: { flex: 1, fontSize: 32, fontWeight: '800', color: COLORS.white, lineHeight: 36, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
});
