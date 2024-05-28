import fetch from 'node-fetch';
import { readFile, writeFile } from 'fs/promises';
import chalk from 'chalk';

async function fetchAndSaveZenRecord(username) {
    try {
        const url = `https://ch.tetr.io/api/users/${username}/records`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch user records: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(`Failed to fetch user records: ${data.error || 'Unknown error'}`);
        }

        const zenRecord = data.data?.zen;

        if (!zenRecord) {
            throw new Error(`ZEN record not found for user ${username}`);
        }

        const { level, score } = zenRecord;
        const timestamp = new Date().toISOString();

        const progressionData = { timestamp, level, score };

        let existingProgression = [];

        try {
            const existingData = await readFile('zen_progression.json', 'utf-8');
            existingProgression = JSON.parse(existingData);
        } catch (error) {
            console.error('zen_progression.json does not exist, initialising progression data.');
        }

        if (existingProgression.length > 0) {
            const latestScore = existingProgression[existingProgression.length - 1].score;
            if (score < latestScore) {
                existingProgression = [];
                console.error('ZEN score reset detected, clearing progression data.');
            }
        }

        existingProgression.push(progressionData);

        await writeFile('zen_progression.json', JSON.stringify(existingProgression, null, 2));

        console.log(chalk.green('Progression data saved successfully.'));
    } catch (error) {
        console.error('Error fetching and saving ZEN record:', error.message);
    }
}

const username = 'zen';
fetchAndSaveZenRecord(username);
