# 🌐 Using MongoDB Atlas (Cloud Database)

Your Chronicle app is configured to use **MongoDB Atlas** - a cloud-hosted MongoDB database. This means **you don't need to install MongoDB locally!**

---

## ✅ Already Configured!

Your `.env` file is already set up with your MongoDB Atlas connection:

```env
MONGO_URI=mongodb+srv://krishankshh54:krishankshh54@chronicle.yiq6jyw.mongodb.net/chronicle_db?retryWrites=true&w=majority&appName=chronicle
```

**You're all set! No additional MongoDB setup needed.**

---

## 🚀 Quick Start

Just run these commands:

### 1. Setup Database (First Time Only)
```bash
cd NextGen/backend
pip install -r requirements.txt
python setup.py
```

This will:
- ✅ Connect to your MongoDB Atlas database
- ✅ Create database indexes
- ✅ Create admin user (admin001/admin123)

### 2. Start Backend
```bash
python run.py
```

### 3. Start Frontend (New Terminal)
```bash
cd NextGen/frontend
npm install
npm run dev
```

**That's it!** No MongoDB installation required! 🎉

---

## 📊 What is MongoDB Atlas?

MongoDB Atlas is:
- ☁️ **Cloud-hosted** - No installation needed
- 🔒 **Secure** - Automatic backups and encryption
- 🚀 **Fast** - Global distribution
- 💰 **Free tier** - Perfect for development
- 🌍 **Accessible** - From anywhere with internet

---

## 🔗 Your MongoDB Atlas Details

| Item | Value |
|------|-------|
| **Cluster** | chronicle.yiq6jyw.mongodb.net |
| **Database** | chronicle_db |
| **Username** | krishankshh54 |
| **App Name** | chronicle |

---

## 🛠️ Managing Your Database

### Option 1: MongoDB Compass (Recommended)
Download the MongoDB Compass GUI:
1. Go to: https://www.mongodb.com/try/download/compass
2. Install MongoDB Compass
3. Connect using your connection string:
   ```
   mongodb+srv://krishankshh54:krishankshh54@chronicle.yiq6jyw.mongodb.net/
   ```
4. Browse your data visually!

### Option 2: MongoDB Atlas Web UI
1. Go to: https://cloud.mongodb.com/
2. Login with your MongoDB account
3. Select your "chronicle" cluster
4. Browse collections and data

### Option 3: mongosh (Command Line)
```bash
# Install mongosh
brew install mongosh  # macOS
# or download from https://www.mongodb.com/try/download/shell

# Connect to your database
mongosh "mongodb+srv://krishankshh54:krishankshh54@chronicle.yiq6jyw.mongodb.net/chronicle_db"

# View collections
show collections

# Query data
db.students.find()
db.users.find()
```

---

## 📦 Collections Created

After running `python setup.py`, you'll have:

### **users** collection
- Contains admin and staff accounts
- Default admin: admin001 / admin123

### **students** collection
- Contains student accounts
- Created when students register

Both collections have unique indexes on:
- `email`
- `roll_no` (students) or `login_id` (users)

---

## 🔒 Security Notes

### ⚠️ Important for Production

Your current credentials are in the `.env` file. For production:

1. **Create a new database user:**
   - Go to MongoDB Atlas → Database Access
   - Create a user with a strong password
   - Limit permissions (readWrite only)

2. **Whitelist IP addresses:**
   - Go to MongoDB Atlas → Network Access
   - Add your server's IP address
   - Remove "0.0.0.0/0" (allows all IPs)

3. **Update connection string:**
   ```env
   MONGO_URI=mongodb+srv://new_username:new_password@chronicle.yiq6jyw.mongodb.net/chronicle_db?retryWrites=true&w=majority
   ```

4. **Use environment variables:**
   - Never commit `.env` to git
   - Use secrets management in production

---

## ✅ Advantages of MongoDB Atlas

| Feature | Benefit |
|---------|---------|
| **No Installation** | Start coding immediately |
| **Automatic Backups** | Your data is safe |
| **Scalability** | Grows with your app |
| **Free Tier** | 512MB storage free forever |
| **Monitoring** | Built-in performance insights |
| **Global CDN** | Fast worldwide access |

---

## 🐛 Troubleshooting

### Connection Error
```
pymongo.errors.ServerSelectionTimeoutError
```

**Solutions:**
1. **Check internet connection** - Atlas requires internet
2. **Verify credentials** - Check username/password in `.env`
3. **Network Access** - Add your IP in MongoDB Atlas → Network Access
4. **Firewall** - Make sure port 27017 isn't blocked

### IP Whitelist Error
```
connection attempt failed: bad auth : authentication failed
```

**Solution:**
1. Go to MongoDB Atlas dashboard
2. Click "Network Access"
3. Click "Add IP Address"
4. Add "0.0.0.0/0" (allow all) for development
5. Or add your specific IP address

### Authentication Failed
```
Authentication failed
```

**Solution:**
Check your `.env` file has the correct credentials:
```env
MONGO_URI=mongodb+srv://krishankshh54:krishankshh54@chronicle.yiq6jyw.mongodb.net/chronicle_db?retryWrites=true&w=majority&appName=chronicle
```

---

## 🔄 Switching Between Local and Cloud

### Current: MongoDB Atlas (Cloud)
```env
# In backend/.env
MONGO_URI=mongodb+srv://krishankshh54:krishankshh54@chronicle.yiq6jyw.mongodb.net/chronicle_db?retryWrites=true&w=majority&appName=chronicle
```

### To Use Local MongoDB Instead:
```env
# In backend/.env
MONGO_URI=mongodb://localhost:27017
```

Then install and start MongoDB locally:
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt-get install mongodb
sudo systemctl start mongod
```

---

## 📈 Monitoring Your Database

### MongoDB Atlas Dashboard
1. Go to https://cloud.mongodb.com/
2. Select your "chronicle" cluster
3. View:
   - Real-time operations
   - Storage usage
   - Connection metrics
   - Query performance

### Check Connection from Code
```python
from pymongo import MongoClient

client = MongoClient("mongodb+srv://...")
try:
    # Test connection
    client.server_info()
    print("✅ Connected!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

---

## 💡 Pro Tips

1. **Use MongoDB Compass** - Visual GUI is easier than command line
2. **Set up monitoring** - Get alerts for issues
3. **Regular backups** - Atlas does this automatically
4. **Index optimization** - Already set up by `setup.py`
5. **Connection pooling** - PyMongo handles this automatically

---

## 📚 Learn More

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [PyMongo Tutorial](https://pymongo.readthedocs.io/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

---

**Your database is in the cloud! Code from anywhere! ☁️**

No MongoDB installation needed - just `python run.py` and start coding! 🚀
