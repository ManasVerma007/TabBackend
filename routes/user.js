const { Router } = require("express");
const User = require("../models/user");
const GoogleUser = require("../models/usergoogle");
const Usertabs = require("../models/usertabs");

const router = Router();
const { validateToken } = require("../services/authentication");

router.get("/signin", (req, res) => {
  return res.render("login");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    // Check if the user exists in Usertabs collection
    const user = await User.findOne({ email });
    if (!user) {
      // If the user doesn't exist, return an error
      return res.status(401).json({ error: "User not found" });
    }
    const existingUserTabs = await Usertabs.findOne({ userId: user.id });
    if (!existingUserTabs) {
      // User does not exist, create an entry with three folders
      const userTabsData = {
        userId: user.id,
        userName: user.fullname,
        folders: [
          {
            folderId: "0",
            folderName: "work",
            tabs: [],
          },
          {
            folderId: "1",
            folderName: "Music",
            tabs: [],
          },
          {
            folderId: "2",
            folderName: "miscellaneous",
            tabs: [],
          },
        ],
      };
      // Create a new entry in Usertabs collection
      console.log(userTabsData)
      await Usertabs.create(userTabsData);
      console.log(userTabsData)
    }

    // Send the token in the response
    return res
      .cookie("token", token)
      .status(200)
      .json({ message: "Signin successful", token });
  } catch (error) {
    console.log(error)
    // Assuming you want to send an error status and a JSON response
    return res.status(401).json({ error: "Incorrect Email or Password" });
  }
});

router.post("/googlesignin", async (req, res) => {
  const { fullname, email } = req.body;

  try {
    const user = await GoogleUser.findOne({ email });

    if (!user) {
      const newgoogleUser = await GoogleUser.create({
        email,
        fullname,
      });
    }
    const token = await GoogleUser.GenerateToken(fullname, email);

    // console.log(token)
    // Send the token in the response
    const usercurr = await GoogleUser.findOne({ email });

    const existingUserTabs = await Usertabs.findOne({ userId: usercurr.id });

    if (!existingUserTabs) {
      // User does not exist, create an entry with three folders
      const userTabsData = {
        userId: usercurr.id,
        userName: usercurr.fullname,
        folders: [
          {
            folderId: "0",
            folderName: "work",
            tabs: [],
          },
          {
            folderId: "1",
            folderName: "Music",
            tabs: [],
          },
          {
            folderId: "2",
            folderName: "miscellaneous",
            tabs: [],
          },
        ],
      };
      await Usertabs.create(userTabsData);
      console.log(userTabsData);

    }
    return res.status(200).json({ message: "Signin successful", token }); // Include the token in the response
  } catch (error) {
    console.log(error)
    // Assuming you want to send an error status and a JSON response
    return res.status(401).json({ error: "Incorrect Email or Password" });
  }
});

router.get("/googletoken/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await GoogleUser.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const fullname = user.fullname;
    // console.log(user)
    const token = await GoogleUser.GenerateToken(fullname, email);
    console.log(token);

    // Send the token in the response
    return res.status(200).json({ message: "Token generated", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  const { fullname, email, password } = req.body;

  // Check if required fields are present
  if (!fullname || !email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide all required fields" });
  }

  try {
    const newUser = await User.create({
      fullname,
      email,
      password,
    });

    // Assuming you want to send a success status and a JSON response
    return res.status(201).json({ message: "Thank you for signing up" });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.get("/getuserdetail", (req, res) => {
  const { token } = req.query;
  // Extract the 'token' parameter from the URL query string

  try {
    const userPayload = validateToken(token);
    // Send the user information as a JSON response
    res.json(userPayload);
  } catch (error) {
    // Set the HTTP response status to 400 (Bad Request)
    res.status(400);
    res.json({ error: "Invalid token" });
  }
});

module.exports = router;
