const mongoose = require("mongoose");
const express = require("express");
const { User, Course, Admin } = require('../db');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../middleware/auth');
const { authenticateJwt } = require("../middleware/auth");
const { z } = require('zod'); // Import Zod

const router = express.Router();

router.get('/me',authenticateJwt,async(req,res)=>{
    const admin = await Admin.findOne({username:req.user.username})
    if(!admin){
        res.status(403).json({msg:"Admin doesnt exist"})
        return
    }
    res.json({
        username: admin.username
    })
})

// Zod schema for signup input validation
const signupSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string().min(6),
  });
  
  router.post('/signup', async (req, res) => {
    try {
      const { username, password } = signupSchema.parse(req.body);
  
      const admin = await Admin.findOne({ username, password });
      if (admin) {
        res.status(403).json({ message: 'Admin already exists' });
      } else {
        const obj = { username, password };
        const newAdmin = new Admin(obj);
        newAdmin.save();
  
        const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
        res.json({ message: 'Admin created successfully', token });
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.errors });
    }
  });

// Zod schema for login input validation
const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });
  
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
  
      const admin = await Admin.findOne({ username, password });
      if (admin) {
        const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
        res.json({ message: "logged in successfully", token });
      } else {
        res.status(403).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error: error.errors });
    }
  });
  

router.post('/courses',authenticateJwt,async(req,res)=>{
    const course = new Course(req.body)
    await course.save()
    res.json({message: 'Course created successfully',courseId: course.id});
});

router.put('/courses/:courseId',authenticateJwt,async (req,res) =>{
    const course = await Course.findByIdAndUpdate(req.params.courseId,req.body,{new: true})
    if(course){
        res.json({message: 'course updated successfully'})
    }else{
        res.status(404).json({message: 'course not found'})
    }
});

router.get('/courses',authenticateJwt,async(req,res)=>{
    const courses = await Course.find({})
    res.json({courses})
});

router.get('/course/:courseId',authenticateJwt,async (req,res)=>{
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId)
    res.json({course})
});

module.exports = router