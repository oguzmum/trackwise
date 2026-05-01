# ToDos

- [x] I need to be able to create categories; or define default ones and let the user live with that :D

## Image Recognition and OCR

- [ ] Allow user to upload or photograph a paper habit tracker: use OCR + image recognition to parse the grid (habits × days) and auto-import the completed entries into the database
  - [ ] upload image
  - [x] recognize table pattern in the image
  - [ ] recognize the habit in each line (OCR?) - if the habit is not yet in the DB, create a new one (or at least give a dialog where the user can manually adjust some things)
  - [x] recognize on which day which habit was done
  - [ ] save the habit entries in the db
  - [ ] have an archive of used images and it's outcomes - also make it editable afterwards
  - [ ] ..
  - [ ] warp perspective
  - [x] skip first row as it is the dates normally


---

# Bugs

- [x] wrong date is used. UI shows yesterday as today (maybe a timezone issue?)

## Statistics
- [x] Weekly completion rate doesn't work
- [x] day completed per week doesn't work
- [x] 90 day heatmap doesn't work