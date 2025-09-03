import express, { Request, Response } from 'express';
import ejs from 'ejs';
import multer from 'multer';
import path from 'path';

const app = express();
const port = 3000;

interface Task {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string;
  attachments: string[];
  order: number;
}

// Storage and other stuff
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });

// set ejs
app.set("views", __dirname + "/../views");
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(express.json())
app.use(express.static('uploads')); 
app.use(express.static('public'));  

let tasks: Task[] = [
  { id: 1, title: 'Do the MPP lab', completed: false, dueDate: '2025-09-05', attachments: [], order: 1 },
  { id: 2, title: 'Sleep at least 8 hours', completed: true, dueDate: '2025-09-04', attachments: [], order: 2 }
];

function sortTasks() {
  tasks.sort((a, b) => a.order - b.order)
}

app.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let filteredTasks: Task[] = tasks;

  if (status) {
    filteredTasks = tasks.filter(task => {
      if (status === 'completed') {
        return task.completed;

      } else if (status === 'pending') {
        return !task.completed;
      }
      return true;
    });
  }

  res.render('index', { tasks: filteredTasks });
});

app.post('/add', (req: Request, res: Response) => {

  const { title, dueDate } = req.body;
 
 
  const newTask: Task = {
    id: tasks.length + 1,
    title: title as string,
    order: tasks.length+1,
    completed: false,
    dueDate: dueDate as string,
    attachments: []
  };
  tasks.push(newTask);
  sortTasks();
  res.redirect('/');
});

app.post('/update-order', (req: Request, res: Response) => {
  const newOrder = req.body.order as number[];

  if (!newOrder || !Array.isArray(newOrder)) {
    return res.status(400).send('Invalid order data');
  }

  newOrder.forEach((id, index) => {
    const task = tasks.find(task => task.id === id);
    if (task) {
      task.order = index + 1;
    }
  });

  sortTasks(); 
  res.status(200).send('Order updated successfully');
});

app.post('/complete/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(task => task.id === id);
  if (task) {

    task.completed = true;
  }
  res.redirect('/');
});

app.post('/upload/:id', upload.single('attachment'), (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(task => task.id === id);

  if (task && req.file) {
    task.attachments.push(req.file.filename);
  }
  res.redirect('/');
});

app.listen(port, () => {

  console.log(`Server is running on http://localhost:${port}`);
});