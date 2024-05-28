import { readFile, writeFile, access } from 'fs/promises';
import chalk from 'chalk';

async function ensurePersonalRecords() {
    const initialRecords = {
        highestAverageScorePerDay: 0,
        highestScoreInOneDay: 0,
        highestScoreInOneMonth: 0
    };

    try {
        await access('personal_records.json');
        const personalRecordsData = await readFile('personal_records.json', 'utf-8');
        const personalRecords = JSON.parse(personalRecordsData);

        const updatedRecords = { ...initialRecords, ...personalRecords };
        await writeFile('personal_records.json', JSON.stringify(updatedRecords, null, 2));
        return updatedRecords;
    } catch (error) {
        await writeFile('personal_records.json', JSON.stringify(initialRecords, null, 2));
        console.error('personal_records.json does not exist, initialising personal bests.');
        return initialRecords;
    }
}

async function readProgressionData() {
    try {
        await access('zen_progression.json');
        const data = await readFile('zen_progression.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('zen_progression.json does not exist or is inaccessible.');
        throw error;
    }
}

function calculateTimeDifferences(progression) {
    return progression.slice(1).map((entry, i) => {
        const prevEntry = progression[i];
        const currEntry = entry;
        const prevTime = new Date(prevEntry.timestamp);
        const currTime = new Date(currEntry.timestamp);

        const timeDifferenceMs = currTime - prevTime;
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);
        const scoreDifference = currEntry.score - prevEntry.score;

        return { timeDifferenceDays, scoreDifference, currEntry, prevEntry };
    });
}

function calculateScores(timeDifferences) {
    let totalScoreImprovement = 0;
    let totalTimeTaken = 0;
    let scoreInLastDay = 0;
    let scoreInLastMonth = 0;

    timeDifferences.forEach(({ timeDifferenceDays, scoreDifference }) => {
        if (timeDifferenceDays > 0) {
            totalScoreImprovement += scoreDifference / timeDifferenceDays;
            totalTimeTaken += timeDifferenceDays;
            if (timeDifferenceDays <= 1) {
                scoreInLastDay = scoreDifference;
            }
            if (timeDifferenceDays <= 30) {
                scoreInLastMonth = scoreDifference;
            }
        } else {
            console.error('Invalid time difference. Skipping entry.');
        }
    });

    return { totalScoreImprovement, totalTimeTaken, scoreInLastDay, scoreInLastMonth };
}

function updateRecord(newRecord, currentHighest) {
    return newRecord > currentHighest ? newRecord : currentHighest;
}

async function updatePersonalRecords(averageScorePerDay, scoreInLastDay, scoreInLastMonth, personalRecords) {
    personalRecords.highestAverageScorePerDay = updateRecord(averageScorePerDay, personalRecords.highestAverageScorePerDay);
    personalRecords.highestScoreInOneDay = updateRecord(scoreInLastDay, personalRecords.highestScoreInOneDay);
    personalRecords.highestScoreInOneMonth = updateRecord(scoreInLastMonth, personalRecords.highestScoreInOneMonth);

    await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));
    return personalRecords;
}

async function calculateZenProgress() {
    try {
        const personalRecords = await ensurePersonalRecords();
        const progression = await readProgressionData();

        if (progression.length < 2) {
            console.error('Not enough data to calculate statistics.');
            return;
        }

        const timeDifferences = calculateTimeDifferences(progression);
        const { totalScoreImprovement, totalTimeTaken, scoreInLastDay, scoreInLastMonth } = calculateScores(timeDifferences);

        const averageScorePerDay = totalScoreImprovement / totalTimeTaken;
        const updatedRecords = await updatePersonalRecords(averageScorePerDay, scoreInLastDay, scoreInLastMonth, personalRecords);

        const latestEntry = progression[progression.length - 1];

        console.log(chalk.magenta('Zen Progress Summary:'));
        console.log(chalk.magenta(`- Total Logs: ${progression.length}`));

        console.log(chalk.green(`\nCurrent Level: ${latestEntry.level.toLocaleString()}`));
        console.log(chalk.green(`Current Score: ${latestEntry.score.toLocaleString()}`));

        console.log(chalk.yellowBright('\nAverage Score Earned:'));
        console.log(chalk.yellowBright(`- Per Day: ${Math.round(averageScorePerDay).toLocaleString()}`));
        console.log(chalk.yellow(`    Highest Per Day: ${Math.round(updatedRecords.highestAverageScorePerDay).toLocaleString()}`));

        console.log(chalk.cyanBright('\nScore Earned:'));
        console.log(chalk.cyanBright(`- In the Last Day: ${scoreInLastDay.toLocaleString()}`));
        console.log(chalk.cyan(`    Highest In One Day: ${updatedRecords.highestScoreInOneDay.toLocaleString()}`));
        console.log(chalk.cyanBright(`- In the Last Month: ${scoreInLastMonth.toLocaleString()}`));
        console.log(chalk.cyan(`    Highest In One Month: ${updatedRecords.highestScoreInOneMonth.toLocaleString()}`));

    } catch (error) {
        console.error('Error calculating Zen progress:', error.message);
    }
}

calculateZenProgress();
