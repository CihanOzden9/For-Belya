import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { ArrowLeft } from 'lucide-react-native';

export default function AlphabetScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft color={COLORS.primaryText} size={32} />
                <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.centerContent}>
                <Text style={styles.title}>Alphabet Magic</Text>
                <Text style={styles.subtitle}>Coming Soon!</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    backButton: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    backText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primaryText, marginLeft: 10 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 36, fontWeight: '900', color: COLORS.alphabetBtn, marginBottom: 10 },
    subtitle: { fontSize: 24, color: COLORS.primaryText, opacity: 0.6 },
});
