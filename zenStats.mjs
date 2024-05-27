import { readFile, writeFile, access } from 'fs/promises';
import chalk from 'chalk';

async function calculateZenProgress() {
    try {
        try {
            await access('personal_records.json');
        } catch (error) {
            await writeFile('personal_records.json', JSON.stringify({ highestAverageScorePerDay: 0 }, null, 2));
            console.error('personal_records.json does not exist, initialising personal bests.');
        }

        const data = await readFile('zen_progression.json', 'utf-8');
        const progression = JSON.parse(data);

        const numIntervals = progression.length - 1;

        if (numIntervals < 1) {
            console.error('Not enough data to calculate averages.');
            return;
        }

        let totalScoreImprovement = 0;
        let totalTimeTaken = 0;

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

            totalScoreImprovement += (currEntry.score - prevEntry.score) / timeDifferenceDays;
            totalTimeTaken += timeDifferenceDays;
        }

        const averageScorePerDay = totalScoreImprovement / totalTimeTaken;

        const personalRecordsData = await readFile('personal_records.json', 'utf-8');
        const personalRecords = JSON.parse(personalRecordsData);

        if (averageScorePerDay > personalRecords.highestAverageScorePerDay) {
            personalRecords.highestAverageScorePerDay = averageScorePerDay;
            await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));
        }

        console.log(chalk.magenta('Zen Progress Summary:'));
        console.log(chalk.magenta(`- Total Entries: ${progression.length}`));

        const latestEntry = progression[progression.length - 1];
        console.log(chalk.green(`\nCurrent Level: ${latestEntry.level.toLocaleString()}`));
        console.log(chalk.green(`Current Score: ${latestEntry.score.toLocaleString()}`));

        console.log(chalk.yellowBright('\nAverage Score Earned:'));

        console.log(chalk.yellowBright(`- Per Day: ${Math.round(averageScorePerDay).toLocaleString()}`));
        console.log(chalk.yellow(`   Highest Per Day: ${personalRecords.highestAverageScorePerDay.toLocaleString()}`));

    } catch (error) {
        console.error('Error calculating Zen progress:', error.message);
    }
}

calculateZenProgress();
