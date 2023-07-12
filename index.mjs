import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { User, Dealership, SoldVeh, Deal, Car, Admin } from './mongo.mjs';
import multer from 'multer';
import { getAllCars } from './filef/getallcars.mjs';
import cookieParser from 'cookie-parser';
import { getAllDealerships } from './filef/dealershipcars.mjs';
import { getAllCarDealerships } from './filef/cardeallist.mjs';
import { UserCarss } from './filef/usercars.mjs';




dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempelatePath = path.join(__dirname, 'tempelates');
const publicPath = path.join(__dirname, 'public');
const filePath = path.join(__dirname, 'filef');

console.log(publicPath);

app.use(express.static(publicPath));

// Multer middleware setup
const upload = multer();




app.get('/user-signup', (req, res) => {
  res.sendFile(path.resolve(tempelatePath, 'user-signup.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(tempelatePath, 'homepage.html'));
});

app.get('/user-signin', (req, res) => {
  res.sendFile(path.resolve(tempelatePath, 'user-signin.html'));
});


app.get('/user-profile', (req, res) => {
  res.sendFile(path.resolve(tempelatePath, 'user-profile.html'));
});

app.get('/allcars', getAllCars);
app.get('/selcardeal', getAllCarDealerships);
app.get('/seldeal', getAllDealerships);
app.get('/usercar', UserCarss);

app.post('/user-profile', (req, res) => {
 
  try {
    const token = req.headers['x-magic']; 
    const decoded = jwt.verify(token, 'your-secret-key'); 

    const userData = {
      username: decoded.username,
      location: 'New York',
      info: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    };

    // Send the user data as JSON response
    res.json(userData);
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
});



// Start the server




app.post('/user-signup', upload.none(), async (req, res) => {
  try {
    const checking = await User.findOne({ useremail: req.body.email });

    if (checking) {
      return res.status(409).json({ error: 'User details already exist' });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const data = {
        useremail: req.body.email,
        userpassword: hashedPassword,
        userlocation: req.body.location,
        userinfo: req.body.userinfo,
        salt: salt,
      };

      await User.insertMany([data]);
      console.log('Signup successful:', data);
      res.status(200).json({ message: 'Signup successful' });
    }
  } catch (error) {
    console.error('An error occurred during signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});


app.post('/user-signin', upload.none(), async (req, res) => {
  try {
    console.log('Signin successful:', req.body);

    const check = await User.findOne({ useremail: req.body.email });
    if (check) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        check.userpassword
      );
      if (passwordMatch) {
        const token = jwt.sign({ username: req.body.email }, 'your-secret-key');
        res.cookie('token', token, {
          httpOnly: false, 
          secure: false, 
          maxAge: 86400000, 
        });
        res.status(201).json({ success: true });
        
      } else {
        res.send('Incorrect password');
      }
    } else {
      res.send('User not found');
    }
  } catch (e) {
    res.send('An error occurred during signin');
    console.error(e);
  }
});


app.post('/admin-signin', upload.none(), async (req, res) => {
  try {
    console.log('Signin successful:', req.body);

    const check = await Admin.findOne({ name: req.body.email });
    if (check) {
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );
      if (passwordMatch) {
        res.status(201).json({ success: true });
      } else {
        res.send('Incorrect password');
      }
    } else {
      res.send('Admin not found');
    }
  } catch (e) {
    res.send('An error occurred during signin');
    console.error(e);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
