const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const appError = require("../statusHandle/appError");
const handleErrorAsync = require("../statusHandle/handleErrorAsync");
const { isAuth, generateSendJWT } = require("../statusHandle/auth");
const User = require("../models/users");
const router = express.Router();
const handleSuccess = require("../handleSuccess.js");
const handleError = require("../handleError.js");
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

router.post(
  "/addCart",
  isAuth,
  handleErrorAsync(async (req, res, next) => {
    const { image, title, price, quantity } = req.body;

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "找不到該用戶" });
      }

      // 查找是否已有同名商品
      const existingItem = user.cart.find((item) => item.title === title);

      if (existingItem) {
        // 如果已存在，增加數量
        existingItem.quantity = (existingItem.quantity || 1) + (quantity || 1);
      } else {
        // 否則，添加新商品
        const newItem = {
          image: image,
          title: title,
          price: price*quantity,
          quantity: quantity || 1,
        };
        user.cart.push(newItem);
      }

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
  isAuth,
  handleErrorAsync(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "找不到該用戶" });
      }

      res.status(200).json({ cart: user.cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  })
);

router.delete("/cart/:itemId", isAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "找不到該用戶" });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "找不到該商品" });
    }

    user.cart.splice(itemIndex, 1);
    await user.save();

    res.status(200).json({ message: "商品已從購物車中刪除" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// 編輯購物車資訊
router.put(
  "/cart/:itemId",
  isAuth,
  handleErrorAsync(async (req, res, next) => {
    const { image, title, price, quantity } = req.body;
    const itemId = req.params.itemId;

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: "找不到該用戶" });
      }

      const item = user.cart.find((item) => item._id.toString() === itemId);

      if (!item) {
        return res.status(404).json({ error: "找不到該商品" });
      }

      // 更新商品資訊
      if (image !== undefined) item.image = image;
      if (title !== undefined) item.title = title;
      if (price !== undefined) item.price = price;
      if (quantity !== undefined) item.quantity = quantity;

      await user.save();

      res.status(200).json({ message: "商品資訊已更新", cart: user.cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  })
);

module.exports = router;
