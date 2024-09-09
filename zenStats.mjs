import { readFile, writeFile, access } from "fs/promises";  // Import file handling functions
import chalk from "chalk";  // Importing chalk for colored console output

// Function to ensure the existence of a personal records file and initialize it if it doesn't exist
async function ensurePersonalRecords() {
    const initialRecords = {
        highestAverageScorePerDay: 0,
        highestScoreInOneDay: 0,
        highestScoreInOneMonth: 0
    };

    try {
        await access("personal_records.json");  // Check if the file exists
        const personalRecordsData = await readFile("personal_records.json", "utf-8");  // Read the personal records data
        const personalRecords = JSON.parse(personRecordsData);  // Parse the JSON data

        const updatedRecords = { ...initialRecords, ...personalRecords };  // Merge initial records with existing data
        await writeFile("personal_records.json", JSON.stringify(updatedRecords, null, 2));  // Write the updated records back to the file
        return updatedRecords;  // Return the records
    } catch (error) {
        await writeFile("personal_records.json", JSON.stringify(initialRecords, null, 2));  // Initialize the file with default values if it doesn't exist
        console.error(chalk.red("personal_records.json does not exist, initialising personal bests."));
        return initialRecords;
    }
}

// Function to read the zen progression data from the file
async function readProgressionData() {
    try {
        await access("zen_progression.json");  // Check if the progression file exists
        const data = await readFile("zen_progression.json", "utf-8");  // Read the data
        return JSON.parse(data);  // Parse and return the data
    } catch (error) {
        throw new Error(`zen_progression.json does not exist, please run "npm run fetchZen".`);  // Throw an error if the file is missing
    }
}

// Function to calculate score earned today and this month
function calculateScoreTodayAndThisMonth(progression) {
    const today = new Date().toISOString().split("T")[0];  // Get the current date in "YYYY-MM-DD" format
    const currentYearMonth = today.slice(0, 7);  // Get the current year and month in "YYYY-MM"

    let scoreToday = 0;  // Initialize score earned today
    let scoreThisMonth = 0;  // Initialize score earned this month

    // Iterate over progression data to calculate score today and this month
    for (let i = progression.length - 1; i > 0; i--) {
        const currentEntry = progression[i];
        const prevEntry = progression[i - 1];

        const currentEntryDate = currentEntry.timestamp.split("T")[0];  // Get date of the current entry
        const prevEntryDate = prevEntry.timestamp.split("T")[0];  // Get date of the previous entry

        const currentYearMonthEntry = currentEntryDate.slice(0, 7);  // Get year and month of the current entry

        // If the current entry is from today, calculate the score earned today
        if (currentEntryDate === today) {
            scoreToday += currentEntry.score - prevEntry.score;
        }

        // If the current entry is from the same month, calculate the score earned this month
        if (currentYearMonthEntry === currentYearMonth) {
            scoreThisMonth += currentEntry.score - prevEntry.score;
        }
    }

    return { scoreToday, scoreThisMonth };  // Return the calculated scores
}

// Function to calculate time differences between each progression entry
function calculateTimeDifferences(progression) {
    return progression.slice(1).map((entry, i) => {
        const prevEntry = progression[i];
        const currEntry = entry;
        const prevTime = new Date(prevEntry.timestamp);
        const currTime = new Date(currEntry.timestamp);

        const timeDifferenceMs = currTime - prevTime;
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);
        const scoreDifference = currEntry.score - prevEntry.score;

        if (!isFinite(timeDifferenceDays) || timeDifferenceDays <= 0) {
            console.error(chalk.red("Invalid time difference. Skipping entry:"));
            console.log(JSON.stringify(prevEntry, null, 2));
            console.log(JSON.stringify(currEntry, null, 2));
            console.log();
            return null;
        }

        return { timeDifferenceDays, scoreDifference, currEntry, prevEntry };
    }).filter(entry => entry !== null);
}

// Function to calculate various score statistics based on time differences
function calculateScores(timeDifferences) {
    let totalScoreImprovement = 0;
    let totalTimeTaken = 0;

    timeDifferences.forEach(({ timeDifferenceDays, scoreDifference }) => {
        totalScoreImprovement += scoreDifference / timeDifferenceDays;
        totalTimeTaken += timeDifferenceDays;
    });

    return { totalScoreImprovement, totalTimeTaken };
}

// Function to update a personal record if the new record is higher
function updateRecord(newRecord, currentHighest) {
    return newRecord > currentHighest ? newRecord : currentHighest;
}

// Function to update the personal records file with new values
async function updatePersonalRecords(averageScorePerDay, scoreToday, scoreThisMonth, personalRecords) {
    personalRecords.highestAverageScorePerDay = updateRecord(averageScorePerDay, personalRecords.highestAverageScorePerDay);
    personalRecords.highestScoreInOneDay = updateRecord(scoreToday, personalRecords.highestScoreInOneDay);
    personalRecords.highestScoreInOneMonth = updateRecord(scoreThisMonth, personalRecords.highestScoreInOneMonth);

    await writeFile("personal_records.json", JSON.stringify(personalRecords, null, 2));  // Write the updated records to the file
    return personalRecords;  // Return the updated records
}

// Main function to calculate ZEN progression statistics
async function calculateZenProgress() {
    try {
        const personalRecords = await ensurePersonalRecords();  // Ensure the personal records exist
        const progression = await readProgressionData();  // Read the progression data

        if (progression.length < 2) {
            console.error(chalk.red("Not enough data to calculate statistics."));
            return;
        }

        const timeDifferences = calculateTimeDifferences(progression);
        const { totalScoreImprovement, totalTimeTaken } = calculateScores(timeDifferences);

        const averageScorePerDay = totalScoreImprovement / totalTimeTaken;  // Calculate the average score improvement per day

        const { scoreToday, scoreThisMonth } = calculateScoreTodayAndThisMonth(progression);  // Calculate score earned today and this month

        const updatedRecords = await updatePersonalRecords(averageScorePerDay, scoreToday, scoreThisMonth, personalRecords);  // Update personal records

        const latestEntry = progression[progression.length - 1];  // Get the latest progression entry

        // Output the calculated statistics to the console
        console.log(chalk.magenta("tetr-zen:"));
        console.log(chalk.magenta(`- Total Logs: ${progression.length}`));

        console.log(chalk.green(`\nCurrent Level: ${latestEntry.level.toLocaleString()}`));
        console.log(chalk.green(`Current Score: ${latestEntry.score.toLocaleString()}`));

        console.log(chalk.yellowBright("\nAverage Score Earned:"));
        console.log(chalk.yellowBright(`- Per Day: ${Math.round(averageScorePerDay).toLocaleString()}`));
        console.log(chalk.yellow(`    Highest Per Day: ${Math.round(updatedRecords.highestAverageScorePerDay).toLocaleString()}`));

        console.log(chalk.cyanBright("\nScore Earned:"));
        console.log(chalk.cyanBright(`- Today: ${scoreToday.toLocaleString()}`));
        console.log(chalk.cyan(`    Highest In One Day: ${updatedRecords.highestScoreInOneDay.toLocaleString()}`));
        console.log(chalk.cyanBright(`- This Month: ${scoreThisMonth.toLocaleString()}`));
        console.log(chalk.cyan(`    Highest In One Month: ${updatedRecords.highestScoreInOneMonth.toLocaleString()}`));

    } catch (error) {
        console.error(chalk.red("Error calculating ZEN statistics:", error.message));
    }
}

calculateZenProgress();  // Invoke the main function to calculate the progression statistics
