import { readFile, writeFile, access } from "fs/promises";
import chalk from "chalk";

// Function to ensure that the personal records file exists; initializes it if missing
async function ensurePersonalRecords() {
    const initialRecords = {
        highestAverageScorePerDay: 0,
        highestScoreInOneDay: 0,
        highestScoreInOneMonth: 0
    };

    try {
        // Check if the personal records file exists
        await access("personal_records.json");
        // Read and parse the personal records file
        const personalRecordsData = await readFile("personal_records.json", "utf-8");
        return JSON.parse(personalRecordsData);
    } catch (error) {
        // If file doesn't exist, create it with default values
        console.error(chalk.red("personal_records.json does not exist, initializing personal bests."));
        await writeFile("personal_records.json", JSON.stringify(initialRecords, null, 2));
        return initialRecords;
    }
}

// Function to read the progression data from the JSON file
async function readProgressionData() {
    try {
        // Check if the progression file exists
        await access("zen_progression.json");
        // Read and parse the progression data
        const data = await readFile("zen_progression.json", "utf-8");
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`zen_progression.json does not exist, please run "npm run fetchZen".`);
    }
}

// Function to calculate score earned today and in the current month
function calculateCurrentScores(progression) {
    const today = new Date().toISOString().split("T")[0]; // Get today's date
    const currentYearMonth = today.slice(0, 7); // Get current year and month

    let scoreToday = 0;
    let scoreThisMonth = 0;

    // Iterate through progression data from most recent to older entries
    for (let i = progression.length - 1; i > 0; i--) {
        const currentEntry = progression[i];
        const prevEntry = progression[i - 1];

        const currentEntryDate = currentEntry.timestamp.split("T")[0]; // Extract date from timestamp
        const currentYearMonthEntry = currentEntryDate.slice(0, 7); // Extract year-month from timestamp

        // If entry is from today, calculate score earned today
        if (currentEntryDate === today) {
            scoreToday += currentEntry.score - prevEntry.score;
        }

        // If entry is from the current month, accumulate score earned this month
        if (currentYearMonthEntry === currentYearMonth) {
            scoreThisMonth += currentEntry.score - prevEntry.score;
        }
    }

    return { scoreToday, scoreThisMonth };
}

// Function to calculate average daily score over the entire data period
function calculateTotalAverageScore(progression) {
    const firstEntry = progression[0]; // First recorded entry
    const lastEntry = progression[progression.length - 1]; // Most recent entry

    const totalScore = lastEntry.score - firstEntry.score; // Total score gained
    const startDate = new Date(firstEntry.timestamp).toISOString().split("T")[0];
    const endDate = new Date(lastEntry.timestamp).toISOString().split("T")[0];

    // Calculate the total number of days (including first and last day)
    const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    const averageScorePerDay = totalScore / totalDays;

    return { averageScorePerDay, totalScore, totalDays };
}

// Function to update records if a new value is higher
function updateRecord(newRecord, currentHighest) {
    return newRecord > currentHighest ? newRecord : currentHighest;
}

// Function to update personal records if new values exceed previous ones
async function updatePersonalRecords(averageScorePerDay, scoreToday, scoreThisMonth, personalRecords) {
    personalRecords.highestAverageScorePerDay = updateRecord(averageScorePerDay, personalRecords.highestAverageScorePerDay);
    personalRecords.highestScoreInOneDay = updateRecord(scoreToday, personalRecords.highestScoreInOneDay);
    personalRecords.highestScoreInOneMonth = updateRecord(scoreThisMonth, personalRecords.highestScoreInOneMonth);

    // Write updated records to the file
    await writeFile("personal_records.json", JSON.stringify(personalRecords, null, 2));
    return personalRecords;
}

// Main function to process and display ZEN progression statistics
async function calculateZenProgress() {
    try {
        const personalRecords = await ensurePersonalRecords(); // Ensure records exist
        const progression = await readProgressionData(); // Load progression data

        // If there are fewer than 2 entries, there's not enough data to compute statistics
        if (progression.length < 2) {
            console.error(chalk.red("Not enough data to calculate statistics."));
            return;
        }

        const { averageScorePerDay, totalScore, totalDays } = calculateTotalAverageScore(progression);
        const { scoreToday, scoreThisMonth } = calculateCurrentScores(progression);
        const updatedRecords = await updatePersonalRecords(averageScorePerDay, scoreToday, scoreThisMonth, personalRecords);
        const latestEntry = progression[progression.length - 1];

        // Display calculated statistics
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

// Run the function to calculate and display ZEN progression statistics
calculateZenProgress();
