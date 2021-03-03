Fri Oct  9 11:18:01 CEST 2020
"new"(post) | grow(post) / echo(repost)

Fri Sep 25 11:15:13 CEST 2020
Design:
    Hostnode (abstract: typically implented in NodeJS or Simshim)
        Canopy (lufo/API for data)
        Grapevine (Exchange data with other Hostnodes, basically the layer between different instances of Canpoy)
    Treehut (abstract: typically implemented as a WebTreehut)
        Graphical user interface _only_ (depends on access to a Core API)
        "User"
    Web Server
        Hostnode  (has settings for selecting what Hostnodes to connect to)
        (Web) Treehut
            Server rendered
            Executable in browser (stores data on web server)
            Serves a "User" to browser client and client also updates this journal
    Hub
        Primarily a public Hostnode
        Proably offers a web page (default: web node with READ access only)
        May offer "Hostnode and Web server" as a service to users.
    Electron desktop client
        A package of
                Treehut
                Hostnode
            where Treehut is pegged to local Hostnode
    Simshim (Browser JS shiming: network communication, web server journal and hostnode)
        Hostnode
        Treehut
        "Journal"
    "User"
        Preferences
        Journal
            Datastructure used to keep track of "what and which order" user have looked at cards
                hence it is a browsing history (but these concepts are to easily confused with browser terminology)
                it does NOT know about card content, or which cards are connected to which.

