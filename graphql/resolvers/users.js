const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { UserInputError } = require("apollo-server");

const User = require("../../models/User");
const { registerValidator, loginValidator } = require("../../utils/validators");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );
}

module.exports = {
  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = loginValidator(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username });
      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = "Wrong Credentials";
        throw new UserInputError("Wrong Credentials", { errors });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token
      };
    },

    async registerUser(
      _,
      {
        registerInput: { username, email, password, confirmPassword }
      }
    ) {
      //TODO: Validate user data
      const { valid, errors } = registerValidator(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      // Make sure user doesn't already exists
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("Username taken", {
          error: {
            username: "username already exists"
          }
        });
      }
      // hash password and create a auth token and save the user
      password = await bcrypt.hash(password, 12);

      const newUser = new User({
        username,
        email,
        password,
        createdAt: new Date().toISOString()
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res._id,
        token
      };
    }
  }
};
