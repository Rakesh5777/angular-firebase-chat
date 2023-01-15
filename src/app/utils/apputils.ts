export class AppUtils {
    static getFortyCharacters(text: string): string {
        if (text?.length > 40) {
            return text.substring(0, 40) + '...';
        }
        return text;
    }
}
