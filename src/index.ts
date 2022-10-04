// import some modules that are required for the application
import express from "express";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser"
import cors from "cors"
import jwt from "jsonwebtoken"
import config from "../config.json"

// initiate express
const app = express();

// create a prisma client
const prisma = new PrismaClient();

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  console.log(req.headers)
  const token = authHeader && authHeader.split(' ')[1];
  if(token == null) return res.sendStatus(401);

  jwt.verify(token, config.accessTokenSecret, (err: any, user: any) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next();

  });
}

// the entrt point
const main = async () => {
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(cors())

  app.get("/", (req: any, res: any) => {
    res.end("Hello")
  });

  app.get("/projects", authenticateToken, async (req: any, res: any) =>{
    const projects = await prisma.project.findMany();
    res.json(projects.filter(project => project.author == req.user.name))
  })

  app.post("/createProject", authenticateToken, async (req: any, res: any) =>{
    console.log(req.body)
    const project = await prisma.project.create({
      data: {
	title: req.body.title,
	description: req.body.desc,
	repo: req.body.repo,
	author: req.body.author
      }
    })
    res.end("Success")
  })

  app.post("/signup", async (req: any, res: any) =>{
    console.log(req.body)
    const User = await prisma.user.findFirst({
      where: {
	email: req.body.email
      }
    })
    if(User !== null){
      res.end("Nope");
    }else{
      const user = await prisma.user.create({
	data: {
	  username: req.body.username,
	  email: req.body.email,
	  password: req.body.password
	}
      })
      res.end("Success")
    }
  })

  app.post("/login", async (req: any, res: any) =>{
    // login
    const user = await prisma.user.findFirst({
      where: {
	username: req.body.username,
	password: req.body.password
      }
    });
    console.log(user)
    if(user !== null){
      const accessToken = jwt.sign({name: user.username, enail: user.email, id: user.id}, config.accessTokenSecret);
      console.log(accessToken);
      res.json({ accessToken: accessToken });

    }
  })

  app.listen(3001);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    prisma.$disconnect();
    process.exit(1);
  });
