echo "*#*#*#*#*#*#* START OBACHAN *#*#*#*#*#*#*"

echo "START BUILD"
node build/commonClass.js

echo "START SERVER"
#node main.js
nodemon main.js
