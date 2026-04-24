import { signupService, loginService } from "./auth.service.js";

export const signupController = async (req, res) => {
  try {
    const user = await signupService(req.body);

    res.status(201).json({
      message: "Signup successful",
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const result = await loginService(req.body);

    res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};