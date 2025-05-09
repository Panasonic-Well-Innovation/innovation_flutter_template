# Innovation Flutter Template

## Setup

### FVM

Install [FVM](https://fvm.app/)

```sh
brew tap leoafarias/fvm

brew install fvm
# fvm --version
# 3.2.1

fvm install 3.27.4
```

Then be sure to close your editor and reopen it. Run the following in a terminal at this projects path.

```sh
fvm flutter version
```

The version should be `3.27.4`.

### Supabase

```sh
brew install supabase/tap/supabase

# supabase --version
# 2.12.1
```

## Usage

To create a project based on this template, run the following VSCode Task:

- Open tasks: `CMD+SHIFT+B`
- Select `[GFT] Create app from template`
- Enter your application name (e.g. my_app)
- Enter you company name (e.g. mycompanyname)
