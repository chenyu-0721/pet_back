const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const appError = require("../statusHandle/appError");
const handleErrorAsync = require("../statusHandle/handleErrorAsync");
const { isAuth, generateSendJWT } = require("../statusHandle/auth");
const User = require("../models/users");
const router = express.Router();

/* * GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/**
 * * 註冊
 */

router.post(
  "/sign_up",
  handleErrorAsync(async (req, res, next) => {
    let { email, password, confirmPassword, name } = req.body;
    // 內容不可為空
    if (!email || !password || !confirmPassword) {
      return next(appError(400, "欄位未填寫正確！", next));
    }
    // 密碼正確
    if (password !== confirmPassword) {
      return next(appError(400, "密碼不一致！", next));
    }
    // 密碼 8 碼以上
    if (!validator.isLength(password, { min: 8 })) {
      return next(appError(400, "密碼字數低於 8 碼", next));
    }
    // 是否為 Email
    if (!validator.isEmail(email)) {
      return next(appError(400, "Email 格式不正確", next));
    }

    // 加密密碼
    password = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      email,
      password,
    });
    generateSendJWT(newUser, 201, res);
  })
);

/**
 *  * 登入
 */
router.post(
  "/sign_in",
  handleErrorAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(appError(400, "帳號密碼不可為空", next));
    }
    const user = await User.findOne({ email }).select("+password");
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return next(appError(400, "您的密碼不正確", next));
    }
    generateSendJWT(user, 200, res);
  })
);

router.post("/cart", async (req, res) => {
  const { token, product } = req.body;

  if (!token) {
    return res.status(401).json({ error: "未授權訪問，請先登入" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "找不到使用者" });
    }

    // 將商品加入購物車
    user.cart.push(product);

    // 保存用戶資訊，更新購物車
    await user.save();

    res.status(200).json({ message: "成功將商品加入購物車", cart: user.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

router.post(
  "/addCart",
  isAuth,
  handleErrorAsync(async (req, res, next) => {
    const { image, title, price, quantity } = req.body;

    const newItem = {
      image: image,
      title: title,
      price: price,
      quantity: quantity,
    };

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "找不到該用戶" });
      }

      user.cart.push(newItem);

      await user.save();

      res.status(200).json({ message: "商品已添加到購物車" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  })
);

router.get(
  "/getCart",
  isAuth, // 身份驗證中介軟體
  handleErrorAsync(async (req, res, next) => {
    try {
      // 找到當前使用者
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "找不到該用戶" });
      }

      // 回應購物車內容
      res.status(200).json({ cart: user.cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  })
);

module.exports = router;
