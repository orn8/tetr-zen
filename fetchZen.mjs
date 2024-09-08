import fetch from 'node-fetch';  // Importing the `fetch` function to make HTTP requests
import { readFile, writeFile } from 'fs/promises';  // Importing `readFile` and `writeFile` for file handling
import chalk from 'chalk';  // Importing `chalk` for colored console output

// Asynchronous function to fetch and save ZEN record data for a specific user
async function fetchAndSaveZenRecord(username) {
    try {
        const url = `https://ch.tetr.io/api/users/${username}/summaries/zen`;  // Constructing the API URL for the user's records
        const response = await fetch(url);  // Making an HTTP GET request to fetch the user's data

        if (!response.ok) {  // Checking if the response is successful (status code 200)
            throw new Error(`Failed to fetch user records: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();  // Parsing the JSON response

        if (!data.success) {  // Checking if the API returned a success flag
            throw new Error(`Failed to fetch user records: ${data.error || 'Unknown error'}`);
        }

        const zenRecord = data.data;  // Extracting the ZEN record from the response data

        if (!zenRecord) {  // If ZEN record is not found, throw an error
            throw new Error(`ZEN record not found for user ${username}`);
        }

        const { level, score } = zenRecord;  // Destructuring to get level and score from the ZEN record
        const timestamp = new Date().toISOString();  // Getting the current timestamp in ISO format

        const progressionData = { timestamp, level, score };  // Creating an object to store the progression data

        let existingProgression = [];  // Variable to hold the existing progression data

        try {
            const existingData = await readFile('zen_progression.json', 'utf-8');  // Reading existing progression data from the JSON file
            existingProgression = JSON.parse(existingData);  // Parsing the JSON data
        } catch (error) {
            console.error('zen_progression.json does not exist, initialising progression data.');  // If the file doesn't exist, print an error
        }

        if (existingProgression.length > 0) {  // If there is existing progression data
            const latestScore = existingProgression[existingProgression.length - 1].score;  // Get the last recorded score
            if (score < latestScore) {  // If the current score is lower than the last recorded score
                existingProgression = [];  // Clear the progression data (assume a score reset occurred)
                console.error('ZEN score reset detected, clearing progression data.');
            }
        }

        existingProgression.push(progressionData);  // Add the new progression data to the array

        await writeFile('zen_progression.json', JSON.stringify(existingProgression, null, 2));  // Write the updated progression data to the JSON file

        console.log(chalk.green('Progression data saved successfully.'));  // Print a success message
    } catch (error) {
        console.error('Error fetching and saving ZEN record:', error.message);  // Print any errors encountered during the process
    }
}

const username = 'zen';  // Default username
fetchAndSaveZenRecord(username);  // Call the function with the username
