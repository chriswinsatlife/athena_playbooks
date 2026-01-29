# d3-dsv
This module provides a parser and formatter for delimiter-separated values, most commonly comma-separated values (CSV) or tab-separated values (TSV). These tabular formats are popular with spreadsheet programs such as Microsoft Excel, and are often more space-efficient than JSON. This implementation is based on RFC 4180.

For example, to parse:

js
d3.csvParse("foo,bar\n1,2") // [{foo: "1", bar: "2"}, columns: ["foo", "bar"]]
js
d3.tsvParse("foo\tbar\n1\t2") // [{foo: "1", bar: "2"}, columns: ["foo", "bar"]]
To format:

js
d3.csvFormat([{foo: "1", bar: "2"}]) // "foo,bar\n1,2"
js
d3.tsvFormat([{foo: "1", bar: "2"}]) // "foo\tbar\n1\t2"
To use a different delimiter, such as “|” for pipe-separated values, use d3.dsvFormat:

js
d3.dsvFormat("|").parse("foo|bar\n1|2")) // [{foo: "1", bar: "2"}, columns: ["foo", "bar"]]
For easy loading of DSV files in a browser, see d3-fetch’s d3.csv, d3.tsv and d3.dsv methods.

dsvFormat(delimiter)
js
const csv = d3.dsvFormat(",");
Source · Constructs a new DSV parser and formatter for the specified delimiter. The delimiter must be a single character (i.e., a single 16-bit code unit); so, ASCII delimiters are fine, but emoji delimiters are not.

dsv.parse(string, row)
CAUTION

This method requires the unsafe-eval content security policy.

js
d3.csvParse("foo,bar\n1,2") // [{foo: "1", bar: "2"}, columns: ["foo", "bar"]]
Source · Parses the specified string, which must be in the delimiter-separated values format with the appropriate delimiter, returning an array of objects representing the parsed rows.

Unlike dsv.parseRows, this method requires that the first line of the DSV content contains a delimiter-separated list of column names; these column names become the attributes on the returned objects. For example, consider the following CSV file:


Year,Make,Model,Length
1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
The resulting JavaScript array is:

js
[
  {"Year": "1997", "Make": "Ford", "Model": "E350", "Length": "2.34"},
  {"Year": "2000", "Make": "Mercury", "Model": "Cougar", "Length": "2.38"}
]
The returned array also exposes a columns property containing the column names in input order (in contrast to Object.keys, whose iteration order is arbitrary). For example:

js
data.columns // ["Year", "Make", "Model", "Length"]
If the column names are not unique, only the last value is returned for each name; to access all values, use dsv.parseRows instead (see example).

If a row conversion function is not specified, field values are strings. For safety, there is no automatic conversion to numbers, dates, or other types. In some cases, JavaScript may coerce strings to numbers for you automatically (for example, using the + operator), but better is to specify a row conversion function. See d3.autoType for a convenient row conversion function that infers and coerces common types like numbers and strings.

If a row conversion function is specified, the specified function is invoked for each row, being passed an object representing the current row (d), the index (i) starting at zero for the first non-header row, and the array of column names. If the returned value is null or undefined, the row is skipped and will be omitted from the array returned by dsv.parse; otherwise, the returned value defines the corresponding row object. For example:

js
const data = d3.csvParse(string, (d) => {
  return {
    year: new Date(+d.Year, 0, 1), // lowercase and convert "Year" to Date
    make: d.Make, // lowercase
    model: d.Model, // lowercase
    length: +d.Length // lowercase and convert "Length" to number
  };
});
Note: using + or Number rather than parseInt or parseFloat is typically faster, though more restrictive. For example, "30px" when coerced using + returns NaN, while parseInt and parseFloat return 30.

dsv.parseRows(string, row)
js
d3.csvParseRows("foo,bar\n1,2") // [["foo", "bar"], ["1", "2"]]
Source · Parses the specified string, which must be in the delimiter-separated values format with the appropriate delimiter, returning an array of arrays representing the parsed rows.

Unlike dsv.parse, this method treats the header line as a standard row, and should be used whenever DSV content does not contain a header. Each row is represented as an array rather than an object. Rows may have variable length. For example, consider the following CSV file, which notably lacks a header line:


1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
The resulting JavaScript array is:

js
[
  ["1997", "Ford", "E350", "2.34"],
  ["2000", "Mercury", "Cougar", "2.38"]
]
If a row conversion function is not specified, field values are strings. For safety, there is no automatic conversion to numbers, dates, or other types. In some cases, JavaScript may coerce strings to numbers for you automatically (for example, using the + operator), but better is to specify a row conversion function. See d3.autoType for a convenient row conversion function that infers and coerces common types like numbers and strings.

If a row conversion function is specified, the specified function is invoked for each row, being passed an array representing the current row (d), the index (i) starting at zero for the first row, and the array of column names. If the returned value is null or undefined, the row is skipped and will be omitted from the array returned by dsv.parse; otherwise, the returned value defines the corresponding row object. For example:

js
const data = d3.csvParseRows(string, (d, i) => {
  return {
    year: new Date(+d[0], 0, 1), // convert first column to Date
    make: d[1],
    model: d[2],
    length: +d[3] // convert fourth column to number
  };
});
In effect, row is similar to applying a map and filter operator to the returned rows.

dsv.format(rows, columns)
js
d3.csvFormat([{foo: "1", bar: "2"}]) // "foo,bar\n1,2"
js
d3.csvFormat([{foo: "1", bar: "2"}], ["foo"]) // "foo\n1"
Source · Formats the specified array of object rows as delimiter-separated values, returning a string. This operation is the inverse of dsv.parse. Each row will be separated by a newline (\n), and each column within each row will be separated by the delimiter (such as a comma, ,). Values that contain either the delimiter, a double-quote (") or a newline will be escaped using double-quotes.

If columns is not specified, the list of column names that forms the header row is determined by the union of all properties on all objects in rows; the order of columns is nondeterministic. If columns is specified, it is an array of strings representing the column names. For example:

js
const string = d3.csvFormat(data, ["year", "make", "model", "length"]);
All fields on each row object will be coerced to strings. If the field value is null or undefined, the empty string is used. If the field value is a Date, the ECMAScript date-time string format (a subset of ISO 8601) is used: for example, dates at UTC midnight are formatted as YYYY-MM-DD. For more control over which and how fields are formatted, first map rows to an array of array of string, and then use dsv.formatRows.

dsv.formatBody(rows, columns)
js
d3.csvFormatBody([{foo: "1", bar: "2"}]) // "1,2"
js
d3.csvFormatBody([{foo: "1", bar: "2"}], ["foo"]) // "1"
Source · Equivalent to dsv.format, but omits the header row. This is useful, for example, when appending rows to an existing file.

dsv.formatRows(rows)
js
d3.csvFormatRows([["foo", "bar"], ["1", "2"]]) // "foo,bar\n1,2"
Source · Formats the specified array of array of string rows as delimiter-separated values, returning a string. This operation is the reverse of dsv.parseRows. Each row will be separated by a newline (\n), and each column within each row will be separated by the delimiter (such as a comma, ,). Values that contain either the delimiter, a double-quote (") or a newline will be escaped using double-quotes.

To convert an array of objects to an array of arrays while explicitly specifying the columns, use array.map. For example:

js
const string = d3.csvFormatRows(data.map((d, i) => {
  return [
    d.year.getUTCFullYear(), // Assuming d.year is a Date object.
    d.make,
    d.model,
    d.length
  ];
}));
If you like, you can also array.concat this result with an array of column names to generate the first row:

js
const string = d3.csvFormatRows([[
    "year",
    "make",
    "model",
    "length"
  ]].concat(data.map((d, i) => {
  return [
    d.year.getUTCFullYear(), // Assuming d.year is a Date object.
    d.make,
    d.model,
    d.length
  ];
})));
dsv.formatRow(row)
js
d3.csvFormatRow(["foo", "bar"]) // "foo,bar"
Source · Formats a single array row of strings as delimiter-separated values, returning a string. Each column within the row will be separated by the delimiter (such as a comma, ,). Values that contain either the delimiter, a double-quote (") or a newline will be escaped using double-quotes.

dsv.formatValue(value)
js
d3.csvFormatValue("foo") // "foo"
Source · Format a single value or string as a delimiter-separated value, returning a string. A value that contains either the delimiter, a double-quote (") or a newline will be escaped using double-quotes.

csvParse(string, row)
Equivalent to d3.dsvFormat(",").parse.

csvParseRows(string, row)
Equivalent to d3.dsvFormat(",").parseRows.

csvFormat(rows, columns)
Equivalent to d3.dsvFormat(",").format.

csvFormatBody(rows, columns)
Equivalent to d3.dsvFormat(",").formatBody.

csvFormatRows(rows)
Equivalent to d3.dsvFormat(",").formatRows.

csvFormatRow(row)
Equivalent to d3.dsvFormat(",").formatRow.

csvFormatValue(value)
Equivalent to d3.dsvFormat(",").formatValue.

tsvParse(string, row)
Equivalent to d3.dsvFormat("\t").parse.

tsvParseRows(string, row)
Equivalent to d3.dsvFormat("\t").parseRows.

tsvFormat(rows, columns)
Equivalent to d3.dsvFormat("\t").format.

tsvFormatBody(rows, columns)
Equivalent to d3.dsvFormat("\t").formatBody.

tsvFormatRows(rows)
Equivalent to d3.dsvFormat("\t").formatRows.

tsvFormatRow(row)
Equivalent to d3.dsvFormat("\t").formatRow.

tsvFormatValue(value)
Equivalent to d3.dsvFormat("\t").formatValue.

autoType(object)
Source · Given an object (or array) representing a parsed row, infers the types of values on the object and coerces them accordingly, returning the mutated object. This function is intended to be used as a row accessor function in conjunction with dsv.parse and dsv.parseRows. For example, consider the following CSV file:


Year,Make,Model,Length
1997,Ford,E350,2.34
2000,Mercury,Cougar,2.38
When used with d3.csvParse,

js
d3.csvParse(string, d3.autoType)
the resulting JavaScript array is:

js
[
  {"Year": 1997, "Make": "Ford", "Model": "E350", "Length": 2.34},
  {"Year": 2000, "Make": "Mercury", "Model": "Cougar", "Length": 2.38}
]
Type inference works as follows. For each value in the given object, the trimmed value is computed; the value is then re-assigned as follows:

If empty, then null.
If exactly "true", then true.
If exactly "false", then false.
If exactly "NaN", then NaN.
Otherwise, if coercible to a number, then a number.
Otherwise, if a date-only or date-time string, then a Date.
Otherwise, a string (the original untrimmed value).
Values with leading zeroes may be coerced to numbers; for example "08904" coerces to 8904. However, extra characters such as commas or units (e.g., "$1.00", "(123)", "1,234" or "32px") will prevent number coercion, resulting in a string.

Date strings must be in ECMAScript’s subset of the ISO 8601 format. When a date-only string such as YYYY-MM-DD is specified, the inferred time is midnight UTC; however, if a date-time string such as YYYY-MM-DDTHH:MM is specified without a time zone, it is assumed to be local time.

Automatic type inference is primarily intended to provide safe, predictable behavior in conjunction with dsv.format and dsv.formatRows for common JavaScript types. If you need different behavior, you should implement your own row accessor function.

For more, see the d3.autoType notebook.

Content security policy
If a content security policy is in place, note that dsv.parse requires unsafe-eval in the script-src directive, due to the (safe) use of dynamic code generation for fast parsing. (See source.) Alternatively, use dsv.parseRows.

Byte-order marks
DSV files sometimes begin with a byte order mark (BOM); saving a spreadsheet in CSV UTF-8 format from Microsoft Excel, for example, will include a BOM. On the web this is not usually a problem because the UTF-8 decode algorithm specified in the Encoding standard removes the BOM. Node.js, on the other hand, does not remove the BOM when decoding UTF-8.

If the BOM is not removed, the first character of the text is a zero-width non-breaking space. So if a CSV file with a BOM is parsed by d3.csvParse, the first column’s name will begin with a zero-width non-breaking space. This can be hard to spot since this character is usually invisible when printed.

To remove the BOM before parsing, consider using strip-bom.