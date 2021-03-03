# TODO
hints:
    auto polling: let DEBUG_NBR_OF_RETRIEVERS = 1; 

note: content of a post should be dimmed out until the author profile of that post has been donwliaded
        i.e. also those authors NOT trusted (followed etc) needs to be downloaded to authenticate contetnt
            or put else ... post without 


follow
add basic features such as follow, bookmark, etc and add needed pages
what next?

## Roadmap
Steps
>    basic pages: tree, signer+cardlist, dashboard, follow
    basic infrastructure: hub, treehut settingsv(add/remove/"share with peers" nodes), Hostnode
    improve: "polling best" by figuring out smart strategies
    non-simshim: treehut on laptop electron, hub
    harden: secure, integrity checks, actual signing etc
    finalize an mvp
    stealth launch network
    advanced features: tags, search, mail pgp, TOR integration
    integrate with mastodon

## TODO
    polling
        scheduled
            //by score
            by following: tree, signer
            by interaction: visited tree, signer
                most time spent on
                last visited
        ondemand
                    (turn off poll when doing this)
            donwload siblings: when pausing a while in the middle of the tree and browsing a bit
            signer  (do this last beuase this is more tricky because cards might enter at any place in the list, hence 

     dashboard
                Topbar becomes DashboardBar
            //Figure out what dashboard looks like using pen and paper
           Explore best content:
               //explorer impl: scroll row horizontally: cards from this category
               // Break out the InfiniteList
               //Refactor explorer to make it easy and generic to work with
                        //break out inifite list
                        //   different size of cards on same row
                                //measure width and height, store in o. and re-use that in render 
                        //different kinds of rows
                        poolable items
                //Title (category) of row (title should not scroll) 
                //Make balloons clickable
                // Fix vertical scroll 
                // Add topbar with links to: settings menu, my profile, possibly peers icon
                //        postion icons
                Proof-of-concept categories/rows:
                    Topmost cards
                    Last download aka new (should have its own lufo for added... dont care about remove, just skip if not found)
                Prototype:
                    Following: "best from what I follow"
                    New: "best from what is new"
                    Visited: "best from what I last visited"
                    Make card clickable and go to card in tree view
                mvp:
                    Replies to my own comments
                    Categories and their order saved to session
                    Random cards
            list best
                card from each
                    peer
                    tree
                tree from forest
        select roots cards
        select best cards
        //swiping should scroll card into focus and keep the old card where it is
        //        maybe its possible to preserve the old card place and use that.

     follow signer
            //change signer to signerNode that contains data: {} so that it can be signed
            //        fix this mess: getSigner / getSignerNode
            //        getCard -> getCard (strip node part) and getCardNode
           // add follow-storage.js
            //            (make it specifc for storing only node and store both trees and signers in the future)
            //    add follow signer pub (sha256 for card)
            //     (
            //        probably peers should not keep track of what others are following, better to always ask,
            //        but there could be a point in keeping track which peer gave you which signer, to know who to ask
            //    )
            //add sigernNode.signer.data.date (which is signed by signer)
            //add following button to signer page...
            //    add follow mechanism....
           add follow dashboard page
                //add followbar (a back button) 
                fix transition back from: signature page back to follow page (dashboard flicker)
                      its probably the stage that needs to have some kind of info from what page we are coming form or something..
                                maybe hints?!
           add retrieveFollowedSigners (not same as score, score should be included in result,
                    //look at the code and see what happens
                  confusing signerNode stuff... 
                        //first fix so that "Download following from all peers" works
                        //backup whole project!!!!
                        refactor Nnaming convention for
                                //Peer
                              //Signer: add proxy, look into how node is used
                            //     Card: fix Node... grabNode instead of grabCard... grabN
                         //      Change peers array naming to peerProxies
                    //enusre download follwing works
                    //ensure download Signers description data works: seems to just enque... try make call an ondemand
>>                  add download signer cards
                            retrieveSignerCards...
                                the sha526s first... what to call this function?!
                                    date it so that only those between certain dates, will be filtered
                                    but preferably not the once I already have
                                        also probably do not send an exclude list (because its infinite)
                                            better rely on peer already knowing what i have sent earlier
                                then the actual cards... shoudl be using tree-talk.js... signer-talk.js should referenfe tree-talk.js
                    follow a signer and wait for signer data to download
                    add button to download caards for a signer
                    follow a signer and wait for signer cards to download
                    refactor:
                        following should be exlusively for signers... hence I can change all signatures: Follow_ed_ to Following
                            trees should be watching/observing/tracking/bookmark
                        Signer and signer is confusing
                            change Signer into SignerNode
           refactor signer-cards.js
                replace list with veritcal list
                add bottom bar
                open tree... ? should old tree be replaced?!
            refactor
                signerId to signerPub
 
    add follow cards

    add follwo trees

    add retrieveBestSigners by score (todo figure out how scoring works for signers): signer-talk.js

    integrate signer card list view with signer profile view
            signer view at the top
            scroll cards should minimize signer view (which should have an expand bottom - and automatically expand when at top)
                design signer view so that it makes sense to have it minimized (actually it should only scroll up not be smaller)
                    hence the bottom should have the name, expand bottom and most important details

    add card download by following
            when clicking follow these cards should be downloaded and view updated

        add quota data sizing and multiply with factor
                    replier should estimate how much quota cards will take (and tell peers about this in quote)
                        and use that in card-talk.js
                        it is important that replier and retriever calc the same quota: server pays price if its wrong
                    copy sizing from lufo 


       change get/add card/signer so that items are always treated as Node...
                    everything with card should have sort _last_
            addSigner should also check if incoming signer is a node or not by using ({node, signer}) etc
            maybe get could have an option arg for what type to return    grabSigner(pub, sort)


        //refactor out of card-talk and make generic
        //       try to make GUI  not freeze up all of the time
                    start stop buttons 
                    maube the task with those small buttons?!
        should go through the canopy for the signers you follow (they should have their own lufo)
        should go through the conversatins you follow 

    add settings menu
        list connected nodes (remove)
        list unconnected nodes (add)
        button to ask for peer nodes


   improve cardlistitem design
        impl new CardListItem @see paper design
        impl identicon (fake profile images always tricks people)


    card-talk:
          node should send back how many max scores it wants... 
                   right now its random... make it so that its configurable in client.
                   @depends on client "Preferences" dialog
          when everything seems to work fine and architecture seems to be stable THEN
                   make sure the peer quota is distributed in a proper manner
                   have a look at TODO in file
                   add error/message replies integrty checks
          //introduce debug level
          // ///expected: highest scored cards are downloaded from peer       fix: lufo.adDescending
          // ///              vi +129 canopy/forest.js    enable this again
          //    when scoring cards in forst, update peer upload gauge...
          //              ////replace scorelist with lufo
          //              ////     each impl everywhere
          //              //probably need to save peer in scoretree
          //              //     use the scoretree to save this data
          //              //        update peer totalScore based upon old score in scoretree and the new
          //             //          remove: now peer does not need a cards score lufo
          //    //ensure that new cards when downloaded are added to the tree
          //    //               if peer does not know node has scores it will send them
          //    //                   and it can not know node has these scores
          //    //                       because node will not upload scores it have received from a peer already
          //    //                             hence a peer SHOULD remember what scores it have already sent to node
          //    //enable download / upload in both clients and expect to see that they can clone eathother 100%
          //             ////add upload-quota verififcatiom everytime when client is suppoed to do a reply
          //              ////         make this exceptin/error handling generic 
          //              ////         this may result in server resestting quota while dialog has been created
          //              ////             to fix this:
          //              ////                     keep    the timeslot window where downloads are allowed
          //              ////                     keep    that peers are randomly provided time within this slot
          //              ////                add     a limit so that the time a peer can connect is a window within the open window
          //              ////          i.e
          //              ////   open for download       |----------------------------------------|  : downloadTimeslot
          //              ////   random time open        |------------------------------|            : initiateDownloadTimeslot
          //              ////                                   |--------|  : time to finish download dialog
          //              ////                                                               ^  note: this is not the actual
          //              ////                                                                  time it takes to download the cards
          //              ////                                         it is the time it takes to go through
          //              ////                                                                           the whole dialog
          //      //ensure that quota is changed properly when card are downloaded etc
       //automatic-download-manager
    //   download signers (not followed yet)
    //        //signer-storage, should make sure profile signer is never deleted
    //        //add signer information so I can debug if data is downloaded properly
    //        //update signer view:
    //       //     show description  so I can debug if data is downloaded properly
    //        //   update profile view:
    //        //        add fields that can be updated to existing signer
    //        add signer-talk to download signer information
    //                    when do I want more information about a signer?
    //                            order of importance:
    //                        required: when I am following a signer (updates as replace priv key, source urls, etc) @depend on following
    //                       required: when I look at the signer details - single request
    //                        nice to have: when I follow the signer ? 
    //                        pre-loading: when I like a card ? 
    //              //fetch single signer
    //              //      //add retrieve to card-talk
    //              //      //add reply to card-talk
    //              //      //add start poling when adding new peer
    //              //      //remove the unused files such as donwload manavger
    //              //      //refactor QUOTA to download manager....
    //              //      //    use downbloadManger call to retreive stuff....
    //              //      //        then downloadManger should save latest quota....
    //              //      //            if quota does not exist or have expired, download manager should ask for it
    //              //      //    update card-talk to reflect that cahnges
    //              //      //    then crewate signer-talk file that use this
    //              //      //add methods to download and upload manager
    //              // make sure polling works again
    //              //      //see if it is possible to break up get scores and get cards
    //              //          // refactor to loop
    //              //          //figure out if its possible to create a "projected open"
    //              //          //        this will save one call in some circumstances
    //              //      //add score 0 for peers... so that we know we sent rthe card
    //              // //when above is known, improve on
    //              //          logging: how much quota was needed and how much was used
    //              //          error handling
    //             when clicking face on a card:
    //                   change window and stuff.. remove all of that junk
    //                        //u manager: topup / addGrace <
    //                        //retrieve: no window
    //                   //turn off polling
    //                   //download signer ondemand
    //                   //fix zero delay polling... happens on demand
    //                   //ondemand using "Download once" <<<
    //                   //     add to retrieval whether its ondemand or not
    //                   //         then serving node should let in depending on wether there is quota or not etc....
    //                   //     retrieval exchange message should NOT wait for window to open IF there is ondemand quota left
    //                   //remove ondemand search for keyword() <<<<
    //                   //figure out how to make
    //                   //         polling consumes everything during its window (next refill)
    //                   //         but saves enough for "ondemand"
    //                   //                nbr downloads during window open    <<<<<
    //                   //                         more downloads less percent each time
    //                   //                         

   //show all root cards and orphan cards (orphans always has a placeholder which might be a fake)

   canopy should have access to many cardSets (following, peers, etc...)
        adding new card to canopy should check if card exists in any of the other cardSets
            then remove if its in the wrong dataset
            then add to the proper dataset
            IF a card is an orhpan card (there is a missing chain of cards between root and this one),
                        which should have same key size as ALL the datasets combined, because edge case is that all cards are roots
                    add hash (and the dataset name) to orphanCards lufo 
            IF it is a root card
                        which should have same key size as ALL the datasets combined, because edge case is that all cards are roots
                    add hash (and the dataset name) to rootCards lufo
                    check if there is an orphan card linking to the root AND if so, remove it as an orphan
        create an itterator of some sort for gettnig the root cards, so that they can be displaued in GUI

    swipe between tree views BUT fade when going forward / back
    improve button surfaces

    canopy (has the createCard, fascade to forest etc)
        //add highscore to forest
            //add card to highscore when adding to forest
              // note:   in GUI use trees to find out which cards / children to show and how many,
                        //but use highscore to sort them.
                       //     add score data to GUI (to ensure everything is sorted properly)
!                            this is also an opportunity to find out if there is highscore tree corruption
        //add highscore to peers
        //add scoring by peers mechanism
        add some sort of rebuild highscore mechanism

      Incoming peer score
            multiply the peers score, with 0-1 how much you usually agree with this peer
            those peers that send you score that are very not similar to yours, you give less of value
                this way those who tries to mess up your scoring will be punished.

    Add ghost cards, i.e. cards that are so old they are not used any longer AND should not be downloaded again
            these cards do not contain any data at all, only sha256.
            use a separte datastructure for this
            IMORTANT: this should be visited before downloading from net

    when there is a server:add canopy sessio to profile

    whenever canopy is used, sorting may have changed. this will make it confusing for the user.
        ? how to fix this?! cards may even have gone missing

    scoreboard.js
        when removing element, also remove from parent.children array
        add some sort of Max number of children in children array

    SCORE:
        peers should be scored in reference to how much you usually agree with them,
            to counteract bad behavingh peers
    DM:
        use public key to encrypt message and send using usualy email
        if has direct access send message there

- [ ] Tex kan en content creator ha ”crowd funding goals” ... när X antal Sats kommit in, så låses content upp för de som betalat 
- [ ] Text + torrent attachment

    authors (big part of infrastrucutre, so probably for the code arhictetcure to this early) * 
            // open Signer from post
            //        redesign post
           //create new Signer 
            //    add link to dashboard
            //in Signer page list cards by signer
               //"lufo of lufos"
               //     outer lufo contains references (signer pub key) to inside lufo (which contains sha256 of cards)
               //     when doing remove on a a lufo the referenced lufo also gets destroyed in the outher lufo vice versa
               //     do this in signer-storage, and do NOT turn this into a generic lufo thing
               //inner lufo i a descending lufo by date
               // keep cards in tree-storage, and save card sha156 in signer lufo
            compose message (select from availbable authors)
                //profile manager
                //    add
                //    signers under profile
                //growing tree by composing card
                //    should result in reloading tree with card
                //ensure that other clients gets the card after it has been created
 
## Fix

    canopy.networkSync needs to be restarted when new peers are added or peers are destroyed.
            make canopy listen to grapevine and do this automatically

    expect: connecting to new peer can download content instantly.
            error: needs to wait for an hour, if it takes that long for upload window to close
            fix: ?

    lufo.use seems to default to bubble... should support top or other kinds of sort too
            (only add seems to support both)

    Sha256 needs to be changed to sometingelse so that bitcoin workers have less change of hacking code

     //   rootcards in forest should NOT contain duplicates... instead do as with scoretree... have two separATE
     //       always check the one with the most first..
     //           fix also this with checking bigone first in scoretree
     //make it so that cards sent to other nodes displays EXACTLY the same
     //           in a debug mode... 
     //                   first make sure ALL cards are sent and ingore deal (possible DEBUG or HUB mode for this two)
     //                                       probalby create a deal.js AND create a CONFIG.file with these debug optons
     //                        secondly verify if score is similar or not in GUI
     //                  preferably fix so that this happens in norm.js or something.
     //scorelist.js sort ordering behaviour
     //         figure out proper ordering
     //         and how to put it inside norm
     //cyclic dependencies:
     //examples:   card A says B is parent, and B says A is parent
     //            [C<-]D <-A <-B <-C <-D


## Change
    styling of darktheme... everything extended shoul instead be darker then background


## ---------------------------------------------------------------------------------------------------------------
## Backlog ----- When figuring out what to do next... pick from this list ----------------------------------------
## ---------------------------------------------------------------------------------------------------------------
     icons for indicating status  (maye easier when developing to see that node is online or not)
                    small colored dots in bottom right corner
             downloading         - green (bright)
             uploading           - green (dark)
             idle (but online)   - blue
             offline             - red 

    card design
        card backside: meta/details data
             what peer was is downloaded from
             time of arrival
             links to stuff its related to
             what more meta data is there?
        propely nice looking cards (@depends on [author, card backside], so correc text can be shown)

    add explicit retrieval of next card (in the tree you is reading , when scrolling) from peers * 

    settings/preferences menu
         add/remove nodes (not really needed since simshim can do it... do this when starting with hubs)
             what scores are there in the node?
             add nodes via link
                 depends on a server/hub/public nodes etc
        add public hubs
    hide a card (still there but not visible) * 
    delete a card (will delete its subtree too) *
>    dashboard
            (explorer creates all the different scoreboards, then dashboard sub pages displays them)
                ß.explorer
         levels 3-4:
            0) watched history:
                    authors
                    trees
                    cards
            1) profile:
                    b) best card by followed author
                    c) best by prpofile
            2) discover new:
                    a) author
                            best authors by peer
                    b) tree
                            best tree by peers
                    c) best of best + random
            3) best of the best + random:
                    absolut top in all categories

         itterate... improve on dashboard when adding more features
         depends on having authors i guess
                 sketch what it should be like
                     main sections
                         how big
                         how many?
                         how should items in different sections look like?
                         Decide whether horizontal or vertical scrolling
                 what content is there?
             by most watched trees
             by bookmarked trees
             by following author
             what is new
             random
             by score (best to worst)
                 best of the best
                     biggest tree + topmosts
                 topmosts (roots+orphans)
                 biggest trees

## Grapevine & canopy
     canopy wants to be populated and ask the grapevine
         they talk all the time... whe canopy is updated, the treehut should listen
             treehur shoudl then be able to contrlol grapvine and canopy




--------------------------------------

     populate with canopy data (but mockup) (SHOUDL NOT NEED TO KNOW ABOUT GRAPEVINE HERE)
                      grapevine for retrieval of cards, hence you get all cards from grapevine (through its API)
                          canopy to store cards
                      any host can be used to get cards
                      only a server will store your journal
                      on lightwieght client treehut, the whole canopy can not be stored, hence only a journal is stored
                          the journal can also be stored on a server
                          local updated to journal is cynced on server

                          a while conversation is based on a unique card
                                  we always know the prev
                                  the next is not defined
                                          it is evaluated based on metrics
                                          the next one down (vertically) is the most popular one
                                          the next one right (horizontally) is the second most popular one
                                          the next one left (horizontally) is one you have already seen (essentially back)
                                          
              list topics
              browse conversation
      migrate code from card-talk with the proptype lufo code stuff
              refacetor this code into
                  canopy
                  grapevine
      menubar
          conncet nodes, etc
      search

//Create GUI tool
    //should be possible to have several clients in _same_ window.
    //    this way it will be quicker to do development, not having to launch servers and stuff
Create test-cases for card-talk in GUI
        these test-cases for retrieve and dispense can also be used for mocking GUI by virtual servers running in browser
    //create gui for three apps
    create t3t god like object encapsulation
    create messaging interface between the apps
        a message send/receiever
            basically a router
            but should be possible to replace WHAT is feeding the messages
                socket, rest, etc
                FIRST create something that works in the browser, lets call it
>                    Messydev

