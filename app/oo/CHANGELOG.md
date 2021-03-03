# CHANGELOG
Semantic versioning - Date

### Added
- Tug return value. If not undefined it will escape OO chaining (example: const Mytug = () => return 'hello';)
- OO options now takes a globalProps that can be override. (@see example-1.html for demonstration)

## v0.0.1-0.24 - Thu Oct 15 09:32:43 CEST 2020
### Added
- example-7.html demonstrating the power of "when" option in .on.
### Fixed
- missing return values on multi-parameterized expressions.

## v0.0.1-0.23 - Tue Oct 13 12:36:34 CEST 2020
### Added
- oo.className and oo.classList when support.
- oo.className signature (supports: oo.classList({add:'myclass'}); oo.classList({remove:'myclass'});).
- act signature changed (supports: regenerate, autoId).
- oo.on when options now allow transforms (see example-1.html) (example: .on('foo/bar', {when:{true:{Tug, props:{....).
### Changed
- createAct renamed to createCue.
### Fixed
- oo.go hints route handler propagation.
- oo.on same value propagation (note: object always propagate).
### Removed

## v0.0.1-0.21-15 - Thu Oct  8 08:26:20 CEST 2020
### Added
- oo.go.back
- oo.go hints argument (example: go('my/path', 'Thetitle', {swipe:'left'});).
- oo.on option argument accepts when (.on(PATH, {when:[Boolean,String,'hello',42]}.... .on(PATH, {when:'world'}....).
- oo.on invoked on a path with no data attached to it (use: .on(PATH, {when:undefined}....).
### Changed
- oo.classList, oo.className signatures.
- oo.transition signature.
### Fixed
### Removed

## v0.0.1-0.21-14 - Sat Oct  3 16:02:12 CEST 2020
### Added
- oo.classList.
### Changed
- OO createAct function deprecations.
- OO createStage changed to createAct.
### Fixed
- oo.className now behaves more like className.
### Removed

## v0.0.1-0.21-13 - Fri Oct  2 13:24:21 CEST 2020
### Added
- OO createStage (create/destroy/transition utility).
- oo.children.
- oo.transition (css transition utility).
- oo.store (store listener similar to oo.on, but does not support expressions and listener have to be removed manually).
- Stop onclick bubble event (return false stop bubble, return undefined does not).
- File test-3.html (test speed of store set/listener).
### Changed
- OO route handling is re-written (changes reflected in: example-app-1.html, example-5.html).
- OO onclick signature (favour destructoring).
- OO className signature (supports toggle).
### Fixed
- OO html ref attribute creation.
### Removed
- OO element re-use.

##  v0.0.1-0.21-10 - Thu Sep 24 15:26:54 CEST 2020
### Added
- Browse back, forward handling.
- Prefixed push/replace history state (enables page reload also from file://).
- File example-app-1.html.
- File TODO.md
### Changed
- OO signature, to support OO options.
- Updated test-2.html to reflect broken object tree fix.
### Fixed
- Broken store object tree.
- oo.html, oo.text breaks chain.
### Removed

## v0.0.1-0.21-8 - Thu Sep 24 08:27:14 CEST 2020
### Added
- File CHANGELOG.md

