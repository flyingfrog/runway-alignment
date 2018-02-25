#download from: https://www.faa.gov/airports/airport_safety/airportdata_5010/
#Leave the form set at ALL <everything> and Submit
#Choose the Airport Runways Data link

import sys
import re
import json
import os
import datetime

if len(sys.argv) != 3:
	raise ValueError("Expected arguments: <FAA runway file> <JavaScript decoded file>")

runway_filename = sys.argv[1]
runway_file = open(runway_filename)
js_target_filename = sys.argv[2]
js_target_file = open(js_target_filename, 'w')

#check header to ensure it hasn't changed
header_line = runway_file.readline().strip()
if '"SiteNumber"	"State"	"RunwayID"' not in header_line:
	raise ValueError('Error: Incorrect file or file format has changed')

states = {}
runway_pattern = re.compile('\d+\.\d*\*\w\t(\w\w)\t\'(\d\d)\D?/(\d\d)\D?')



while True:
	curr_line = runway_file.readline().strip()
	if(curr_line == "" or curr_line =="\n"):
		break
	
	results = runway_pattern.match(curr_line)
	if results != None: #no match if not in runway format
		state = results.group(1)
		base_runway = int(results.group(2))
		reciprocal_runway = int(results.group(3))
		if base_runway == 0:
			print(curr_line)
		if state not in states:
			states[state] = {}
			for i in range(1,37):
				states[state][i] = 0

		states[state][base_runway] += 1
		states[state][reciprocal_runway] += 1
	
updated_date = str(datetime.date.fromtimestamp(os.path.getmtime(runway_filename)))

print('updated_time = "%s"; states = %s' % (updated_date,states), file=js_target_file)
js_target_file.close()