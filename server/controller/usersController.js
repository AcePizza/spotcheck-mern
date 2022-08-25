import UserModel from "../model/userModel.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import e, { application } from "express";
import { encryptPassword, verifyPassword } from "../utils/passwordUtils.js";
import { issueToken } from "../utils/jsonWebToken.js";

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await UserModel.find({});
    if (allUsers.length === 0) {
      res.status(200).json({
        msg: "No users registered",
      });
    } else {
      res.status(200).json({
        allUsers,
        number: allUsers.length,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error,
      msg: "Server Failed",
    });
    res.status(404).json({
      error: error,
      msg: "This is a test",
    });
  }
};

const signUp = async (req, res) => {
  console.log({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    emailaddress: req.body.emailaddress,
    password: req.body.password,
    image: req.body.image,
  });

  try {
    const exsistingUser = await UserModel.findOne({
      emailaddress: req.body.emailaddress,
    });
    if (!exsistingUser) {
      const hashedPassword = await encryptPassword(req.body.password);

      const newUser = new UserModel({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        emailaddress: req.body.emailaddress,
        password: hashedPassword,
        image: req.body.image,
      });
      try {
        const savedUser = await newUser.save();
        res.status(201).json({
          user: {
            firstname: savedUser.firstname,
            lastname: savedUser.lastname,
            emailaddress: savedUser.emailaddress,
            password: savedUser.password,
            image: savedUser.image,
          },
          msg: "User created succesfully",
        });
      } catch (error) {
        res.status(409).json({
          msg: "There was an error creating the user",
          error: error,
        });
      }
    } else {
      res.status(409).json({ msg: "User already exist" });
    }
  } catch (error) {
    res.status(401).json({
      msg: "Registering the user could not be completed",
      error: error,
    });
  }
};

const signInUser = async (req, res) => {
  console.log("request", req.body);

  const validateStuff = () => {
    body("emailaddress").isEmail();
    body("password").isLength({ min: 5 });
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      } else {
        return res.status(200).json({ msg: "Coool" });
      }
    };
  };

  try {
    const exsistingUser = await UserModel.findOne({
      emailaddress: req.body.emailaddress,
    });
    if (exsistingUser) {
      const verified = await verifyPassword(req, exsistingUser);
      if (verified) {
        const token = issueToken(exsistingUser._id);

        res.status(200).json({
          title: "Login successfull",
          msg: "User was successfully logged in",
          user: {
            emailaddress: exsistingUser.emailaddress,
            user_id: exsistingUser._id,
          },
          token,
        });
      } else {
        res.status(401).json({
          title: "Verification error",
          msg: "User could not be verified",
        });
      }
    } else {
      res.status(404).json({
        title: "Error not found",
        msg: "Could not find user",
      });
    }
  } catch (error) {
    res.status(500).json({
      title: "Server error",
      msg: "An error was triggered while finding user",
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "spotcheck-images",
    });
    res.status(200).json({
      msg: "Image uploaded succesfully",
      imageURL: uploadResult.url,
    });
  } catch (error) {
    res.status(500).json({
      msg: "There was an error when uploading the image",
      error: error.message,
      errorobject: error,
    });
  }
};

const updateUser = async (req, res) => {
  console.log({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    emailaddress: req.body.emailaddress,
    image: req.body.image,
  });

  const filter = { emailaddress: req.body.emailaddress };
  const update = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    image: req.body.image,
  };

  try {
    const doc = await UserModel.findOneAndUpdate(filter, update);
    if (doc === null) {
      res.status(400).json({ msg: "User not found" });
    } else {
      res.status(200).json({ msg: "User was successfully updated" });
    }
  } catch (error) {
    res.status(500).json({ msg: "Could not complete operation", error: error });
  }
};

const searchUser = async (req, res) => {
  console.log("searchUser req : ", req.params.searchUser);

  try {
    const searchEmail = await UserModel.find({
      firstname: req.params.searchUser,
      lastname: req.params.searchUser,
    }).exec();
    if (searchEmail.length === 0) {
      res.status(201).json({ msg: "Nothing found" });
    } else {
      res.status(200).json({
        msg: "Found the user",
        search,
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server failed", error: error });
  }
};

const findOneUser = async (req, res) => {
  console.log(req.body);
  const verifyEmail = body("emailaddress").isEmail();
  console.log("verifyEmail", verifyEmail);
  // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  console.log("errors", errors);
  // try {
  //   const user = await UserModel.findOne({
  //     emailaddress: req.body.emailaddress,
  //   }).exec();
  //   if (user === null) {
  //     res.status(201).json({ msg: "Could not find any user with that email" });
  //   } else {
  //     res.status(200).json({ msg: "Success", user });
  //   }
  // } catch (error) {
  //   res.status(500).json({ msg: "The request failed", error: error });
  // }
};

export {
  findOneUser,
  getAllUsers,
  signUp,
  signInUser,
  updateUser,
  uploadProfilePicture,
  searchUser,
};
