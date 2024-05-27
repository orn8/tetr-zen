import { readFile } from 'fs/promises';
import chalk from 'chalk';

async function calculateZenProgress() {
    try {
        await readFile('zen_progression.json', 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Error: zen_progression.json does not exist. Please run fetchZen.mjs to create the file.');
            return;
        } else {
            console.error('Error reading zen_progression.json:', error.message);
            return;
        }
    }

    try {
        const existingData = await readFile('zen_progression.json', 'utf-8');
        const existingProgression = JSON.parse(existingData);

        const numEntries = existingProgression.length;

        const currentEntry = existingProgression[numEntries - 1];
        const currentLevel = currentEntry.level;
        const currentScore = currentEntry.score;

        let totalScoreEarnedToday = 0;
        let totalScoreEarnedThisMonth = 0;
        let totalScoreEarnedThisYear = 0;

        let lastTimestamp = new Date(existingProgression[0].timestamp);

        existingProgression.forEach((entry, index) => {
            const { timestamp, score } = entry;
            const timeDifference = new Date(timestamp) - lastTimestamp;

            if (timeDifference > 0) {
                const scoreDifference = score - currentScore;
                const now = new Date();
                const dayAgo = now - (1000 * 60 * 60 * 24);
                const monthAgo = now - (dayAgo * 30); // Assuming 30 days in a month for simplicity
                const yearAgo = now - (dayAgo * 365); // Assuming 365 days in a year for simplicity

                if (timestamp >= dayAgo) {
                    totalScoreEarnedToday += scoreDifference;
                }
                if (timestamp >= monthAgo) {
                    totalScoreEarnedThisMonth += scoreDifference;
                }
                if (timestamp >= yearAgo) {
                    totalScoreEarnedThisYear += scoreDifference;
                }
            }

            lastTimestamp = new Date(timestamp);
        });

        const now = new Date();
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const millisecondsPerMonth = millisecondsPerDay * 30; // Assuming 30 days in a month for simplicity
        const millisecondsPerYear = millisecondsPerDay * 365; // Assuming 365 days in a year for simplicity

        const averageScorePerDay = numEntries >= 2 && (now - lastTimestamp) >= millisecondsPerDay ? totalScoreEarnedToday / (now - (now - millisecondsPerDay)) : 'Not enough data';
        const averageScorePerMonth = numEntries >= 2 && (now - lastTimestamp) >= millisecondsPerMonth ? totalScoreEarnedThisMonth / (now - (now - millisecondsPerMonth)) : 'Not enough data';
        const averageScorePerYear = numEntries >= 2 && (now - lastTimestamp) >= millisecondsPerYear ? totalScoreEarnedThisYear / (now - (now - millisecondsPerYear)) : 'Not enough data';

        console.log(chalk.magenta('Zen Progress Summary:'));
        console.log(chalk.magenta(`- Total Entries: ${numEntries}`));

        console.log(chalk.green(`\nCurrent Level: ${currentLevel}`));
        console.log(chalk.green(`Current Score: ${currentScore}`));

        console.log(chalk.yellow('\nAverage Score Earned:'));
        console.log(chalk.yellow(`- Per Day: ${typeof averageScorePerDay === 'number' ? averageScorePerDay.toFixed(2) : averageScorePerDay}`));
        console.log(chalk.yellow(`- Per Month: ${typeof averageScorePerMonth === 'number' ? averageScorePerMonth.toFixed(2) : averageScorePerMonth}`));
        console.log(chalk.yellow(`- Per Year: ${typeof averageScorePerYear === 'number' ? averageScorePerYear.toFixed(2) : averageScorePerYear}`));
    } catch (error) {
        console.error('Error calculating Zen progress:', error.message);
    }
}

calculateZenProgress();
