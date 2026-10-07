import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

async function downloadImage(url) {
	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
	});

	return response.data;
}

function createDirectoryIfNotExists(directory) {
	fs.mkdirSync(directory, { recursive: true });
}

// Get the extension from the URL path only, ignoring the query string
function getExtension(url) {
	const { pathname } = new URL(url);
	return path.extname(pathname).toLowerCase() || '.png';
}

export async function saveImage(url, imageName, directory) {
	const extension = getExtension(url);
	const imagePath = path.join(directory, `${imageName}${extension}`);

	createDirectoryIfNotExists(directory);

	try {
		const imageData = await downloadImage(url);
		// pipeline waits for the write to finish and closes both streams, even on error
		await pipeline(imageData, fs.createWriteStream(imagePath));

		return imagePath;
	} catch (error) {
		console.error('Error saving image:', error);

		// Clean up incomplete file if it exists
		if (fs.existsSync(imagePath)) {
			fs.unlinkSync(imagePath);
		}

		throw new Error('Failed to save image');
	}
}