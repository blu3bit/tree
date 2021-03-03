if [ -z "$1" ] ; then
    echo "Error: you must supply a tag."
    exit
fi
ls -la
zip -rT ../tree-$1.zip *
mkdir -p ../archive
mv ../tree-$1.zip ../archive
ls -la ../archive | grep $1
