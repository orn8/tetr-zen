import { readFile, writeFile, access } from "fs/promises";  // Import file handling functions
import chalk from "chalk";  // Importing chalk for coloured console output

// Function to ensure the existence of a personal records file and initialise it if it doesn't exist
async function ensurePersonalRecords() {
    const initialRecords = {
        highestAverageScorePerDay: 0,
        highestScoreInOneDay: 0,
        highestScoreInOneMonth: 0
    };

    try {
        // Check if the personal_records.json file exists by attempting to access it
        await access("personal_records.json");
        const personalRecordsData = await readFile("personal_records.json", "utf-8");  // Read the personal records file
        return JSON.parse(personalRecordsData);  // Parse and return the records if the file exists
    } catch (error) {
        // If the file doesn't exist or any error occurs, initialise it with the default records
        console.error(chalk.red("personal_records.json does not exist, initialising personal bests."));
        await writeFile("personal_records.json", JSON.stringify(initialRecords, null, 2));  // Create the file with initial values
        return initialRecords;
    }
}

// Function to read the ZEN progression data from the file
async function readProgressionData() {
    try {
        await access("zen_progression.json");  // Check if the progression file exists
        const data = await readFile("zen_progression.json", "utf-8");  // Read the data from zen_progression.json file
        return JSON.parse(data);  // Parse and return the progression data
    } catch (error) {
        // Throw an error if the progression file is missing
        throw new Error(`zen_progression.json does not exist, please run "npm run fetchZen".`);
    }
}

// Function to calculate score earned today and this month
function calculateCurrentScores(progression) {
    const today = new Date().toISOString().split("T")[0];  // Get the current date in "YYYY-MM-DD" format
    const currentYearMonth = today.slice(0, 7);  // Get the current year and month in "YYYY-MM"

    let scoreToday = 0;  // Initialise score earned today
    let scoreThisMonth = 0;  // Initialise score earned this month

    // Iterate over progression data to calculate score today and this month
    for (let i = progression.length - 1; i > 0; i--) {
        const currentEntry = progression[i];  // Get current entry
        const prevEntry = progression[i - 1];  // Get previous entry

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

    // Return the calculated scores for today and this month
    return { scoreToday, scoreThisMonth };
}

// Function to calculate time differences between each progression entry
function calculateTimeDifferences(progression) {
    // Map through progression entries, calculating time and score differences between consecutive entries
    return progression.slice(1).map((entry, i) => {
        const prevEntry = progression[i];  // Get previous entry
        const currEntry = entry;  // Get current entry
        const prevTime = new Date(prevEntry.timestamp);  // Get timestamp of previous entry
        const currTime = new Date(currEntry.timestamp);  // Get timestamp of current entry

        // Calculate the time difference between the two entries in days
        const timeDifferenceMs = currTime - prevTime;  // Time difference in milliseconds
        const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);  // Convert milliseconds to days

        const scoreDifference = currEntry.score - prevEntry.score;  // Calculate score difference

        // Check if the time difference is valid (non-zero and finite)
        if (!isFinite(timeDifferenceDays) || timeDifferenceDays <= 0) {
            console.error(chalk.red("Invalid time difference. Skipping entry:"));  // Log error for invalid entry
            console.log(JSON.stringify(prevEntry, null, 2));  // Print the previous entry for debugging
            console.log(JSON.stringify(currEntry, null, 2));  // Print the current entry for debugging
            console.log();
            return null;  // Skip this entry
        }

        return { timeDifferenceDays, scoreDifference, currEntry, prevEntry };  // Return the calculated differences
    }).filter(entry => entry !== null);  // Filter out invalid entries
}

// Function to calculate various score statistics based on time differences
function calculateAverageScores(timeDifferences) {
    let totalScoreImprovement = 0;  // Initialise total score improvement
    let totalTimeTaken = 0;  // Initialise total time taken

    // Iterate over time differences and accumulate the score improvements per day and time taken
    timeDifferences.forEach(({ timeDifferenceDays, scoreDifference }) => {
        totalScoreImprovement += scoreDifference / timeDifferenceDays;  // Sum up score improvements per day
        totalTimeTaken += timeDifferenceDays;  // Sum up the total time taken
    });

    return { totalScoreImprovement, totalTimeTaken };  // Return the total improvements and time
}

// Function to update a personal record if the new record is higher
function updateRecord(newRecord, currentHighest) {
    return newRecord > currentHighest ? newRecord : currentHighest;  // Return the higher of the two values
}

// Function to update the personal records file with new values
async function updatePersonalRecords(averageScorePerDay, scoreToday, scoreThisMonth, personalRecords) {
    // Update personal records if new scores exceed current records
    personalRecords.highestAverageScorePerDay = updateRecord(averageScorePerDay, personalRecords.highestAverageScorePerDay);
    personalRecords.highestScoreInOneDay = updateRecord(scoreToday, personalRecords.highestScoreInOneDay);
    personalRecords.highestScoreInOneMonth = updateRecord(scoreThisMonth, personalRecords.highestScoreInOneMonth);

    // Write the updated records to the personal_records.json file
    await writeFile("personal_records.json", JSON.stringify(personalRecords, null, 2));
    return personalRecords;  // Return the updated personal records
}

// Main function to calculate ZEN progression statistics
async function calculateZenProgress() {
    try {
        const personalRecords = await ensurePersonalRecords();  // Ensure the personal records file exists
        const progression = await readProgressionData();  // Read the progression data

        // If there are fewer than 2 progression entries, insufficient data to calculate
        if (progression.length < 2) {
            console.error(chalk.red("Not enough data to calculate statistics."));
            return;
        }

        // Calculate time differences and score changes between progression entries
        const timeDifferences = calculateTimeDifferences(progression);
        const { totalScoreImprovement, totalTimeTaken } = calculateAverageScores(timeDifferences);  // Calculate average score improvements

        // Calculate scores earned today and this month
        const { scoreToday, scoreThisMonth } = calculateCurrentScores(progression);

        // Update personal records based on new statistics
        const updatedRecords = await updatePersonalRecords(totalScoreImprovement / totalTimeTaken, scoreToday, scoreThisMonth, personalRecords);

        const latestEntry = progression[progression.length - 1];  // Get the latest progression entry

        // Output the calculated statistics to the console
        console.log(chalk.magenta("tetr-zen:"));
        console.log(chalk.magenta(`- Total Logs: ${progression.length}`));

        console.log(chalk.green(`\nCurrent Level: ${latestEntry.level.toLocaleString()}`));  // Display current level
        console.log(chalk.green(`Current Score: ${latestEntry.score.toLocaleString()}`));  // Display current score

        console.log(chalk.yellowBright("\nAverage Score Earned:"));
        console.log(chalk.yellowBright(`- Per Day: ${Math.round(totalScoreImprovement / totalTimeTaken).toLocaleString()}`));  // Display average score per day
        console.log(chalk.yellow(`    Highest Per Day: ${Math.round(updatedRecords.highestAverageScorePerDay).toLocaleString()}`));  // Display highest average score per day

        console.log(chalk.cyanBright("\nScore Earned:"));
        console.log(chalk.cyanBright(`- Today: ${scoreToday.toLocaleString()}`));  // Display score earned today
        console.log(chalk.cyan(`    Highest In One Day: ${updatedRecords.highestScoreInOneDay.toLocaleString()}`));  // Display highest score in one day
        console.log(chalk.cyanBright(`- This Month: ${scoreThisMonth.toLocaleString()}`));  // Display score earned this month
        console.log(chalk.cyan(`    Highest In One Month: ${updatedRecords.highestScoreInOneMonth.toLocaleString()}`));  // Display highest score in one month
    } catch (error) {
        console.error(chalk.red("Error calculating ZEN statistics:", error.message));
    }
}

// Execute the main function to calculate ZEN progression statistics
calculateZenProgress();
