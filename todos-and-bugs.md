# ToDos

- [x] I need to be able to create categories; or define default ones and let the user live with that :D

## Image Recognition and OCR

- [x] Allow user to upload or photograph a paper habit tracker: use OCR + image recognition to parse the grid (habits × days) and auto-import the completed entries into the database
  - [x] upload image
  - [x] recognize table pattern in the image
  - [x] recognize the habit in each line via OCR
  - [x] recognize on which day which habit was done
  - [x] skip first row as it is the dates normally
  - [ ] warp perspective - Correct lens distortion which cause curved lines and a slightly ditorted table in general

## Table after scan
- [ ] When a habit is selected in the drop down menu, replace the habit name in the table text field
- [x] save the habit entries in the db
- [x] if the habit is not yet in the DB, create a new one (or at least give a dialog where the user can manually adjust some things)
- [ ] match the monthand year for which the scanned image should be applied
  - [ ] also limit the days that can be added accordingly

## Scanned Images
- [ ] have an archive of used images and it's outcomes - also make it editable afterwards

---

# Bugs

- [x] wrong date is used. UI shows yesterday as today (maybe a timezone issue?)

## Statistics
- [x] Weekly completion rate doesn't work
- [x] day completed per week doesn't work
- [x] 90 day heatmap doesn't work


## Tracker Scan

- [x] in the example-tracker.png the last column is like a total sum.. but the tracker detects it as a day..
  - [x] also the table taht is created before saving the results shows it.. but the days are labeled 1 to 31.. so something is wrong there... 