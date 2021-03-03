# TODO
Tasks ordered by importance.
    Indentation signals
        breakdown of task
        and/or breakdown of problem space
        ? hints but dont provide certainty
## Add
> oo.merge('my/foo, {bar: true}); preserves old values, adds new, creates path if needed
                note:   nestled objectes should also be _merged_
                        original object should be preserved and new values added
        this is an alternative to set with notifyParent

Support for browser style editing
    OO should create style import based on Tug name
    Tug() { css('@./path/to/style/') // OO will add tugname.css;
    This will cause 404 if missing style
    Running application will reveal which styles are _actually used_ by the app, making maintenance so much easier (cleaning)

Kolla att $.each finns med som exempel 

set a default path for ALL listners on a Tug instance using props:{defaultPath: 'asdasdad'}
    which is then used like this: oo.on('./playing'....    (notice the dot)

f.transtion does not support cancel (should remove class and or style)

add "Tag" feature. example: oo('div')(Foo)('Bar')
        div becomes native div, Foo is a Tug creating using a funciton and Tag becomes a html tag named 'bar'
            this can already be done, but a Tag misses some basic styling. default should be div-like styling

## Fix
see if its possible to attach event lsitener to className

fix broken test-1.html

isValue of undefined: listen to path with param, then $.drop property -> isValue of undefined
             in get     if(!is$ && isPreferValue && $.isValue) { 

oo.html(....) oo.clear() // err does not clear html content  only removes children()

$.assign notifierar inte prop lyssnare

since children is used to create ref, you get ref already exists: reproduce:
    (A) add: ref 0 -> 1  (B) add: ref 1 -> 2  (C)destroy first   (D) add: ref 1 -> 2 // err because 2 already created in B. 
    ? just increment counter? ? check for un-used ref ? random

if one adds a `x('hello')`  hence does not provide cbowner and its is NOT the parent adding the cb,
    program will fail to remove this listener (since its the removal of the parent that will remove the listener).
    ? fix   ask merlin to use his magic to somehow "know" which is the one doing making the listening.
                it can not be the child because it does not know, browser call does not work.
                    its nice to be able to do oo(Tug).yay(() => {}); so stuff like this is ugly: oo(Tug).yay(encapsulate(() => {}));

director enter/exit does not work on server rendering (easy to fix, see comments inside function)

refs are NOT unique, because root is not unique
    ? fix   make r/4/4/8 hidden and use hashcode (copied from internet) in DOM elem.
                even br needs a ref, because of server rendering
    ? fix   make every ref unique by converting to Integer (hash, random, or something... preferably something traceable)

nested elements
    ref
        while the delimiter (r/0/1) is kind of nice, the ref string do grow huge with many nested elements.
            ? fix:  unique integer instead... however, internally the / is used to locate and replace elements etc
    chain
        many nested elements created using chaining do bloat the callstack,
        resulting in increased latency and possibly callstack to big to handle.
            ? fix:  oo('div')(oo => oo('div')('span')) where arrow function is invoked in a setTimeout 
                    and introduced at suitable places. this must also be integrated with promises,
                    to keep the server-rendering featur

# Feature request
documentFragment
    f.oof (should always also be propgated with events etc when ever there is an oo
        oof = (cb) => { 1) elmFragment = document.createDocumentFragment.. cb(oo) appendFragment(elmFragment)

blocking AND non-blocking routes (so that topbar can be added on may different routes)

$.type(path.... // type of entity at path. object, string, boolean, undefined if does not exsist (Object.call)
    can be used to test if path exists

virtual DOM elem that is nameable not visible in HTML:
        oo(createStuff)  <- lower case means it should not create an element at all for this virtual DOM

support for setAttributeNS

# Refactor
-

# Investigate
-

