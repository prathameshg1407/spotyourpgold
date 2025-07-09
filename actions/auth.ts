// "use server";

// import Otp from "@/models/otp";
// import PendingUser from "@/models/pendingUser";
// import User from "@/models/user";
// import bcrypt from "bcryptjs";
// import { connectToDB } from "@/services/connectdb";
// import { sendOtpEmail } from "@/services/sendOtpEmail";
// import jwt from "jsonwebtoken";
// import { cookies } from "next/headers";
// import authUser from "./authUser";

// const generateOtp = (length = 5) =>
//   Math.floor(100000 + Math.random() * 900000)
//     .toString()
//     .slice(0, length);

// export const register = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;
//     const fullName = formData.get("fullName") as string;

//     if (!email || !password || !fullName) {
//       return { success: false, message: "Please fill all the fields." };
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return { success: false, message: "User already exists." };
//     }

//     // Throttle OTP resend
//     const recentOtp = await Otp.findOne({ email, purpose: "signup" }).sort({
//       createdAt: -1,
//     });
//     const now = Date.now();
//     if (recentOtp && now - recentOtp.createdAt.getTime() < 60 * 1000) {
//       return {
//         success: true,
//         message: "OTP already sent. Please wait before trying again.",
//       };
//     }

//     // Delete previous pending user and stale OTPs (if any)
//     await Promise.all([
//       PendingUser.deleteOne({ email }),
//       Otp.deleteMany({ email, purpose: "signup" }),
//     ]);

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await PendingUser.create({
//       fullName,
//       email,
//       password: hashedPassword,
//     });

//     const otp = generateOtp();
//     await Otp.create({ email, otp, purpose: "signup" });

//     const res = await sendOtpEmail({
//       to: email,
//       otp,
//       purpose: "signup",
//     });

//     return res;

//     // await new Promise((resolve) => setTimeout(resolve, 1000));

//     //     return{
//     //       success: true,
//     //       message: "OTP sent successfully."
//     //     }
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to register. (error)",
//     };
//   }
// };

// export const verifyOtp = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;
//     const otp = formData.get("otp") as string;
//     const purpose = formData.get("purpose") as string;

//     if (!email || !otp || !purpose) {
//       return {
//         success: false,
//         message: "Please fill all required fields (email, otp, purpose).",
//       };
//     }

//     const latestOtp = await Otp.findOne({ email, purpose }).sort({
//       createdAt: -1,
//     });

//     if (!latestOtp || latestOtp.otp !== otp) {
//       return { success: false, message: "Invalid OTP. Please try again." };
//     }

//     const isExpired =
//       Date.now() - latestOtp.createdAt.getTime() > 5 * 60 * 1000;
//     if (isExpired) {
//       return {
//         success: false,
//         message: "OTP has expired. Please request a new one.",
//       };
//     }

//     if (purpose === "signup") {
//       const pendingUser = await PendingUser.findOne({ email });
//       if (!pendingUser) {
//         return { success: false, message: "Invalid OTP. Try again." };
//       }

//       const createdUser = await User.create({
//         fullName: pendingUser.fullName,
//         email: pendingUser.email,
//         password: pendingUser.password,
//         role: "user",
//       });

//       await Promise.all([
//         Otp.deleteMany({ email, purpose }),
//         PendingUser.deleteOne({ email }),
//       ]);

//       const token = jwt.sign(
//         {
//           id: createdUser._id.toString(),
//           fullName: createdUser.fullName,
//           role: createdUser.role,
//           ownerStatus: createdUser.ownerStatus,
//         },
//         process.env.JWT_SECRET as string,
//         { expiresIn: "1d" }
//       );

//       const cookieStore = await cookies();
//       cookieStore.set("token", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         path: "/",
//         maxAge: 60 * 60 * 24,
//       });

//       return {
//         success: true,
//         message: "Registration successful.",
//         user: {
//           id: createdUser._id.toString(),
//           email: createdUser.email,
//           role: createdUser.role,
//           fullName: createdUser.fullName,
//         },
//       };
//     }

//     if (purpose === "reset_password") {
//       await Promise.all([Otp.deleteMany({ email, purpose })]);

//       return {
//         success: true,
//         message: "OTP verified. You can now reset your password.",
//       };
//     }

//     return {
//       success: false,
//       message: "Invalid purpose.",
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to verify registration. (error)",
//     };
//   }
// };

// export const resendOtp = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;
//     const purpose = formData.get("purpose") as string; // "signup" | "reset_password"

//     if (!email || !purpose) {
//       return {
//         success: false,
//         message: "Please fill all the fields. (email,purpose)",
//       };
//     }

//     // Check if user is still in pending state
//     if (purpose === "signup") {
//       const pendingUser = await PendingUser.findOne({ email });
//       if (!pendingUser) {
//         return {
//           success: false,
//           message: "No email found , enter email again",
//         };
//       }
//     }

//     if (purpose === "reset_password") {
//       const user = await User.findOne({ email });
//       if (!user) {
//         return {
//           success: false,
//           message: "Email not found. Please check and try again.",
//         };
//       }
//     }

//     // Rate-limit: allow only 1 OTP every 60 seconds
//     const recentOtp = await Otp.findOne({ email, purpose }).sort({
//       createdAt: -1,
//     });
//     if (recentOtp && Date.now() - recentOtp.createdAt.getTime() < 60 * 1000) {
//       return {
//         success: false,
//         message: "OTP already sent. Please wait a minute before retrying.",
//       };
//     }

//     await Promise.all([Otp.deleteMany({ email, purpose })]);

//     const otp = generateOtp();

//     await Otp.create({ email, otp, purpose: "signup" });

//     const res = await sendOtpEmail({ to: email, otp, purpose: "signup" });

//     return res;
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to resend OTP. (error)",
//     };
//   }
// };

// export const login = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;

//     if (!email || !password) {
//       return {
//         success: false,
//         message: "Please fill all the fields. ( email, password )",
//       };
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return { success: false, message: "Invalid email. Please try again." };
//     }

//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     if (!isPasswordCorrect) {
//       return { success: false, message: "Invalid password. Please try again." };
//     }

//     const JWT_SECRET = process.env.JWT_SECRET as string;

//     const token = jwt.sign(
//       {
//         id: user._id.toString(),
//         fullName: user.fullName,
//         role: user.role,
//         ownerStatus: user.ownerStatus,
//       },
//       JWT_SECRET,
//       {
//         expiresIn: "1d",
//       }
//     );

//     const cookieStore = await cookies();

//     cookieStore.set("token", token, {
//       httpOnly: true,
//       secure: (process.env.NODE_ENV as string) === "production",
//       sameSite: "strict",
//       path: "/",
//       maxAge: 60 * 60 * 24, // 1 day
//     });

//     return {
//       success: true,
//       message: "Login successful.",
//       user: {
//         id: user._id.toString(),
//         email: user.email,
//         role: user.role,
//         fullName: user.fullName,
//       },
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to login. (error)",
//     };
//   }
// };

// export const forgotPassword = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;

//     if (!email) {
//       return { success: false, message: "Please fill all the fields. (email)" };
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return { success: false, message: "Invalid email. Please try again." };
//     }

//     // Throttle OTP resend
//     const recentOtp = await Otp.findOne({
//       email,
//       purpose: "reset_password",
//     }).sort({
//       createdAt: -1,
//     });
//     const now = Date.now();
//     if (recentOtp && now - recentOtp.createdAt.getTime() < 60 * 1000) {
//       return {
//         success: true,
//         message: "OTP already sent.  Please check your email.",
//       };
//     }

//     // Delete previous stale OTPs (if any)
//     await Promise.all([Otp.deleteMany({ email, purpose: "reset_password" })]);

//     const otp = generateOtp();

//     await Otp.create({ email, otp, purpose: "reset_password" });

//     const res = await sendOtpEmail({
//       to: email,
//       otp,
//       purpose: "reset_password",
//     });

//     return res;
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to login. (error)",
//     };
//   }
// };

// export const resetPassword = async (formData: FormData) => {
//   try {
//     await connectToDB();

//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;

//     if (!email || !password) {
//       return {
//         success: false,
//         message: "Please fill all the fields. (email, password)",
//       };
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return { success: false, message: "Invalid email. Please try again." };
//     }

//     const isSamePassword = await bcrypt.compare(password, user.password);
//     if (isSamePassword) {
//       return {
//         success: false,
//         message: "New password must be different from the current one.",
//       };
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     await User.updateOne({ email }, { password: hashedPassword });

//     return {
//       success: true,
//       message: "Password reset successfully.",
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to reset password. (error)",
//     };
//   }
// };

// export const logout = async () => {
//   try {
//     const cookieStore = await cookies();

//     cookieStore.set("token", "", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       path: "/",
//       maxAge: 0, // expire immediately
//     });

//     return {
//       success: true,
//       message: "User logged out successfully.",
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to logout. (error)",
//     };
//   }
// };

// export const getUser = async () => {
//   interface LeanUser {
//     _id: string;
//     fullName: string;
//     email: string;
//     role: string;
//     createdAt: Date;
//     updatedAt: Date;
//     __v: number;
//   }

//   try {
//     await connectToDB();

//     const auth = await authUser();

//     if (!auth) {
//       return {
//         success: false,
//         message: "Unauthorized",
//       };
//     }

//     const user = await User.findById(auth.id)
//       .select("-password")
//       .lean<LeanUser>();

//     if (!user) {
//       return {
//         success: false,
//         message: "User not found",
//       };
//     }

//     return {
//       success: true,
//       user: {
//         ...user,
//         _id: user._id.toString(),
//       },
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       success: false,
//       message: "Failed to get user. (error)",
//     };
//   }
// };
