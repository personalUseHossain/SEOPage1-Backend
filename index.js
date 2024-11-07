const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(express.json()); // This will parse the incoming JSON data
app.use(cors());

// Initialize multer without disk storage (just for parsing)
const upload = multer();

// API route for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
  // Check if a file is present in the request
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Get the folder from request body, default to 'defaultFolder' if not provided
  const folder = req.body.folder || 'defaultFolder';

  console.log(req.body)

  // Path to the 'uploads' directory, and then to the subfolder
  const folderPath = path.join(__dirname, 'uploads', folder);

  // Create the folder inside 'uploads' directory if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true }); // Create folder recursively
  }

  // Define the file path where the file will be saved
  const filePath = path.join(folderPath, Date.now() + path.extname(req.file.originalname));

  // Save the file manually using fs
  fs.writeFile(filePath, req.file.buffer, (err) => {
    if (err) {
      return res.status(500).send('Error saving the file.');
    }

    // Respond with the file details once the file is saved
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.originalname,
        path: filePath,
        size: req.file.size,
      }
    });
  });
});

// API route to get all file names in a specified folder
app.get('/files/:folder', (req, res) => {
    const folderName = req.params.folder; // Get the folder name from the URL parameters
    const folderPath = path.join(__dirname, 'uploads', folderName); // Path to the specific folder
  
    // Check if the folder exists
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        // If there is an error (e.g., folder doesn't exist), return a 404
        return res.status(404).json({ error: 'Folder not found or unable to read folder' });
      }
  
      // Send the list of file names as a response
      res.status(200).json({
        folder: folderName,
        files: files // Array of file names in the folder
      });
    });
  });

// API route for getting file counts in subdirectories
app.get('/file-counts', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');

  // Read the directories inside 'uploads'
  fs.readdir(uploadsDir, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read uploads directory' });
    }

    const fileCounts = [];

    // Iterate over the directories
    files.forEach(file => {
      if (file.isDirectory()) {
        const folderPath = path.join(uploadsDir, file.name);

        // Get the list of files in the folder and count them
        fs.readdir(folderPath, (err, folderFiles) => {
          if (err) {
            return res.status(500).json({ error: 'Unable to read folder' });
          }

          // Add the folder name and the file count to the result
          fileCounts.push({
            folder: file.name,
            fileCount: folderFiles.length
          });

          // Send the response when all directories have been processed
          if (fileCounts.length === files.filter(f => f.isDirectory()).length) {
            res.status(200).json(fileCounts);
          }
        });
      }
    });
  });
});

// Serve uploaded files (optional)
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
