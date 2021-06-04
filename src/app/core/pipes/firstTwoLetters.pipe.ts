import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'firstTwoLetters',
})
export class FirstTwoLettersPipe implements PipeTransform {

  transform(value: string): string {
    if (value == undefined) return;
    const splittedText = value.split(" ");
    if (splittedText.length > 1) {
      return (splittedText[0][0] + splittedText[1][0]).toUpperCase();
    }
    return value.slice(0,2).toUpperCase();
  }
}