import { readFile, writeFile, access } from 'fs/promises';
import chalk from 'chalk';

async function calculateZenProgress() {
    try {
        try {
            await access('zen_progression.json');
        } catch (error) {
            console.error('zen_progression.json does not exist. Please run "npm run fetchZen".');
            return;
        }

        let personalRecords;
        try {
            await access('personal_records.json');
            const personalRecordsData = await readFile('personal_records.json', 'utf-8');
            personalRecords = JSON.parse(personalRecordsData);

            if (!('highestAverageScorePerDay' in personalRecords)) {
                personalRecords.highestAverageScorePerDay = 0;
            }
            if (!('highestScoreInOneDay' in personalRecords)) {
                personalRecords.highestScoreInOneDay = 0;
            }

            await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));
        } catch (error) {
            personalRecords = { highestAverageScorePerDay: 0, highestScoreInOneDay: 0 };
            await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));
            console.error('personal_records.json did not exist or was missing keys, initialising personal bests.');
        }

        const data = await readFile('zen_progression.json', 'utf-8');
        const progression = JSON.parse(data);

        const numIntervals = progression.length - 1;

        if (numIntervals < 1) {
            console.error('Not enough data to calculate statistics.');
            return;
        }

        let totalScoreImprovement = 0;
        let totalTimeTaken = 0;
        let scoreInLastDay = 0;

        for (let i = 1; i < progression.length; i++) {
            const prevEntry = progression[i - 1];
            const currEntry = progression[i];

            const prevTime = new Date(prevEntry.timestamp);
            const currTime = new Date(currEntry.timestamp);

            const timeDifferenceMs = currTime - prevTime;
            const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

            if (!isFinite(timeDifferenceDays) || timeDifferenceDays <= 0) {
                console.error('Invalid time difference. Skipping entry:', JSON.stringify(prevEntry, null, 2), JSON.stringify(currEntry, null, 2));
                continue;
            }

            const scoreDifference = currEntry.score - prevEntry.score;

            totalScoreImprovement += scoreDifference / timeDifferenceDays;
            totalTimeTaken += timeDifferenceDays;

            if (timeDifferenceDays <= 1) {
                scoreInLastDay = scoreDifference;
            }
        }

        const averageScorePerDay = totalScoreImprovement / totalTimeTaken;

        let highestAverageScorePerDay = personalRecords.highestAverageScorePerDay;
        let highestScoreInOneDay = personalRecords.highestScoreInOneDay;

        if (averageScorePerDay > highestAverageScorePerDay) {
            highestAverageScorePerDay = averageScorePerDay;
            personalRecords.highestAverageScorePerDay = highestAverageScorePerDay;
        }

        if (scoreInLastDay > highestScoreInOneDay) {
            highestScoreInOneDay = scoreInLastDay;
            personalRecords.highestScoreInOneDay = highestScoreInOneDay;
        }

        await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));

        console.log(chalk.magenta('Zen Progress Summary:'));
        console.log(chalk.magenta(`- Total Logs: ${progression.length}`));

        const latestEntry = progression[progression.length - 1];
        console.log(chalk.green(`\nCurrent Level: ${latestEntry.level.toLocaleString()}`));
        console.log(chalk.green(`Current Score: ${latestEntry.score.toLocaleString()}`));

        console.log(chalk.yellowBright('\nAverage Score Earned:'));
        console.log(chalk.yellowBright(`- Per Day: ${Math.round(averageScorePerDay).toLocaleString()}`));
        console.log(chalk.yellow(`    Highest Per Day: ${Math.round(highestAverageScorePerDay).toLocaleString()}`));

        console.log(chalk.cyanBright('\nScore Earned:'));
        console.log(chalk.cyanBright(`- In the Last Day: ${scoreInLastDay.toLocaleString()}`));
        console.log(chalk.cyan(`    Highest In One Day: ${highestScoreInOneDay.toLocaleString()}`));

    } catch (error) {
        console.error('Error calculating Zen progress:', error.message);
    }
}

calculateZenProgress();
