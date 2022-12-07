# Step1:
    Navigate to web-viewer folder
        Run # npm i
    Navigate to webviewer-server folder
        Run # npm i  

# Step2:
    After completing install add the "http://localhost:3000" in webviewer-server/public/lib/ui/configorigin.txt

    The configorigin.txt will be as shown below
   
```
# If the WebViewer lib folder is on another origin from your app then you will
# need to include your app's origin here if you want to load a config file
http://localhost:3000
```


# Step3:
    After all the packages installed in both folders run # npm start in both web-viewer and  webviewer-server