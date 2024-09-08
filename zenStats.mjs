import { readFile, writeFile, access } from 'fs/promises';  // Import file handling functions
import chalk from 'chalk';  // Importing chalk for colored console output

// Function to ensure the existence of a personal records file and initialize it if it doesn't exist
async function ensurePersonalRecords() {
    const initialRecords = {  // Initial records with default values
        highestAverageScorePerDay: 0,
        highestScoreInOneDay: 0,
        highestScoreInOneMonth: 0
    };

    try {
        await access('personal_records.json');  // Check if the file exists
        const personalRecordsData = await readFile('personal_records.json', 'utf-8');  // Read the personal records data
        const personalRecords = JSON.parse(personalRecordsData);  // Parse the JSON data

        const updatedRecords = { ...initialRecords, ...personalRecords };  // Merge initial records with existing data (preferring existing data)
        await writeFile('personal_records.json', JSON.stringify(updatedRecords, null, 2));  // Write the updated records back to the file
        return updatedRecords;  // Return the records
    } catch (error) {
        await writeFile('personal_records.json', JSON.stringify(initialRecords, null, 2));  // Initialize the file with default values if it doesn't exist
        console.error('personal_records.json does not exist, initialising personal bests.');
        return initialRecords;  // Return the initial records
    }
}

// Function to read the zen progression data from the file
async function readProgressionData() {
    try {
        await access('zen_progression.json');  // Check if the progression file exists
        const data = await readFile('zen_progression.json', 'utf-8');  // Read the data
        return JSON.parse(data);  // Parse and return the data
    } catch (error) {
        throw new Error('zen_progression.json does not exist, please run "npm run fetchZen".');  // Throw an error if the file is missing
    }
}

// Function to calculate time differences between each progression entry
function calculateTimeDifferences(progression) {
    return progression.slice(1).map((entry, i) => {  // Skip the first entry and compare each subsequent entry to the previous one
        const prevEntry = progression[i];  // Previous entry
        const currEntry = entry;  // Current entry
        const prevTime = new Date(prevEntry.timestamp);  // Convert the previous timestamp to a date
        const currTime = new Date(currEntry.timestamp);  // Convert the current timestamp to a date

        const timeDifferenceMs = currTime - prevTime;  // Calculate the time difference in milliseconds
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);  // Convert the time difference to days
        const scoreDifference = currEntry.score - prevEntry.score;  // Calculate the score difference

        if (!isFinite(timeDifferenceDays) || timeDifferenceDays <= 0) {  // Handle invalid or zero/negative time differences
            console.error('Invalid time difference. Skipping entry:');
            console.log(JSON.stringify(prevEntry, null, 2));
            console.log(JSON.stringify(currEntry, null, 2));
            console.log();
            return null;  // Return null to indicate an invalid entry
        }

        return { timeDifferenceDays, scoreDifference, currEntry, prevEntry };  // Return the calculated values
    }).filter(entry => entry !== null);  // Filter out any invalid entries
}

// Function to calculate various score statistics based on time differences
function calculateScores(timeDifferences) {
    let totalScoreImprovement = 0;  // Total score improvement across all entries
    let totalTimeTaken = 0;  // Total time taken across all entries
    let scoreInLastDay = 0;  // Score improvement in the last day
    let scoreInLastMonth = 0;  // Score improvement in the last month

    timeDifferences.forEach(({ timeDifferenceDays, scoreDifference }) => {  // Iterate through each time difference
        totalScoreImprovement += scoreDifference / timeDifferenceDays;  // Calculate the average score improvement per day
        totalTimeTaken += timeDifferenceDays;  // Add the time difference to the total
        if (timeDifferenceDays <= 1) {  // If the time difference is 1 day or less
            scoreInLastDay = scoreDifference;  // Set the score difference for the last day
        }
        if (timeDifferenceDays <= 30) {  // If the time difference is 30 days or less
            scoreInLastMonth = scoreDifference;  // Set the score difference for the last month
        }
    });

    return { totalScoreImprovement, totalTimeTaken, scoreInLastDay, scoreInLastMonth };  // Return the calculated statistics
}

// Function to update a personal record if the new record is higher
function updateRecord(newRecord, currentHighest) {
    return newRecord > currentHighest ? newRecord : currentHighest;  // Return the higher value
}

// Function to update the personal records file with new values
async function updatePersonalRecords(averageScorePerDay, scoreInLastDay, scoreInLastMonth, personalRecords) {
    personalRecords.highestAverageScorePerDay = updateRecord(averageScorePerDay, personalRecords.highestAverageScorePerDay);  // Update the highest average score per day
    personalRecords.highestScoreInOneDay = updateRecord(scoreInLastDay, personalRecords.highestScoreInOneDay);  // Update the highest score in one day
    personalRecords.highestScoreInOneMonth = updateRecord(scoreInLastMonth, personalRecords.highestScoreInOneMonth);  // Update the highest score in one month

    await writeFile('personal_records.json', JSON.stringify(personalRecords, null, 2));  // Write the updated records to the file
    return personalRecords;  // Return the updated records
}

// Main function to calculate ZEN progression statistics
async function calculateZenProgress() {
    try {
        const personalRecords = await ensurePersonalRecords();  // Ensure the personal records exist
        const progression = await readProgressionData();  // Read the progression data

        if (progression.length < 2) {  // Check if there is enough data to calculate statistics
            console.error('Not enough data to calculate statistics.');
            return;
        }

        const timeDifferences = calculateTimeDifferences(progression);  // Calculate time differences between entries
        const { totalScoreImprovement, totalTimeTaken, scoreInLastDay, scoreInLastMonth } = calculateScores(timeDifferences);  // Calculate score statistics

        const averageScorePerDay = totalScoreImprovement / totalTimeTaken;  // Calculate the average score improvement per day
        const updatedRecords = await updatePersonalRecords(averageScorePerDay, scoreInLastDay, scoreInLastMonth, personalRecords);  // Update the personal records

        const latestEntry = progression[progression.length - 1];  // Get the latest progression entry

        // Output the calculated statistics to the console using `chalk` for coloring
        console.log(chalk.magenta('tetr-zen:'));
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
        console.error('Error calculating ZEN statistics:', error.message);  // Output any errors encountered
    }
}

calculateZenProgress();  // Invoke the main function to calculate the progression statistics
