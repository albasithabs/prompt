// Prompt Handler Class
class PromptHandler {
    constructor() {
        this.specialContent = {
            dialogs: [],
            audioSettings: [],
            technicalSpecs: []
        };
        this.translatedOptions = new Map();
    }

    // Extract and store special content
    extractSpecialContent(text) {
        // Reset special content
        this.specialContent = {
            dialogs: [],
            audioSettings: [],
            technicalSpecs: []
        };

        // Extract dialogs with their volume settings
        const dialogRegex = /"([^"]+)"\s*(?:\((\d+)%\))?/g;
        let match;
        while ((match = dialogRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const dialogText = match[1];
            const volume = match[2] ? `(${match[2]}%)` : '';
            this.specialContent.dialogs.push({
                original: fullMatch,
                text: dialogText,
                volume: volume
            });
        }

        // Extract audio settings
        const audioRegex = /\((\d+)%\)/g;
        while ((match = audioRegex.exec(text)) !== null) {
            this.specialContent.audioSettings.push(match[0]);
        }

        // Extract technical specifications
        const techRegex = /Kualitas ([^\.]+)\./g;
        while ((match = techRegex.exec(text)) !== null) {
            this.specialContent.technicalSpecs.push(match[0]);
        }
    }

    // Prepare text for translation
    prepareForTranslation(text) {
        let processedText = text;

        // Replace dialogs with placeholders
        this.specialContent.dialogs.forEach((dialog, index) => {
            processedText = processedText.replace(
                dialog.original,
                `[DIALOG_${index + 1}]`
            );
        });

        // Replace audio settings with placeholders
        this.specialContent.audioSettings.forEach((setting, index) => {
            processedText = processedText.replace(
                setting,
                `[AUDIO_${index + 1}]`
            );
        });

        // Replace technical specifications with placeholders
        this.specialContent.technicalSpecs.forEach((spec, index) => {
            processedText = processedText.replace(
                spec,
                `[TECH_${index + 1}]`
            );
        });

        return processedText;
    }

    // Restore special content after translation
    restoreSpecialContent(translatedText) {
        let restoredText = translatedText;

        // Restore dialogs
        this.specialContent.dialogs.forEach((dialog, index) => {
            restoredText = restoredText.replace(
                `[DIALOG_${index + 1}]`,
                `"${dialog.text}" ${dialog.volume}`
            );
        });

        // Restore audio settings
        this.specialContent.audioSettings.forEach((setting, index) => {
            restoredText = restoredText.replace(
                `[AUDIO_${index + 1}]`,
                setting
            );
        });

        // Restore technical specifications
        this.specialContent.technicalSpecs.forEach((spec, index) => {
            restoredText = restoredText.replace(
                `[TECH_${index + 1}]`,
                spec
            );
        });

        return restoredText;
    }

    // Clean up translated text
    cleanupTranslatedText(text) {
        return text
            // Preserve important terms
            .replace(/Audio:/g, 'Audio:')
            .replace(/Master:/g, 'Master:')
            .replace(/Quality:/g, 'Quality:')
            .replace(/Technical specifications:/g, 'Technical specifications:')
            .replace(/Informative narrative:/g, 'Informative narrative:')
            .replace(/Narrative:/g, 'Narrative:')
            .replace(/Dialog:/g, 'Dialog:')
            .replace(/Sound effects:/g, 'Sound effects:')
            .replace(/Background music:/g, 'Background music:')
            .replace(/Professional interview:/g, 'Professional interview:')
            // Remove unwanted placeholders
            .replace(/\[dialog_\d+\]/g, '')
            .replace(/\[Dialog_\d+\]/g, '')
            .replace(/\[Tech_\d+\]/g, '')
            .replace(/\(master:\s*\d+%\)/g, '')
            // Fix common translation mistakes
            .replace(/cinematic -style/g, 'cinematic style')
            .replace(/wide wide/g, 'wide')
            .replace(/natural natural/g, 'natural')
            .replace(/stable stable/g, 'stable')
            .replace(/sunny suny/g, 'sunny')
            // Clean up formatting
            .replace(/\s+/g, ' ')
            .replace(/\s*\.\s*/g, '. ')
            .replace(/\s*,\s*/g, ', ')
            .replace(/\s*:\s*/g, ': ')
            .replace(/\s*-\s*/g, '-')
            .replace(/\s*\(\s*/g, '(')
            .replace(/\s*\)\s*/g, ')')
            .replace(/\s*"\s*/g, '"')
            .replace(/\s*"\s*/g, '"')
            .trim();
    }

    // Translate dropdown options
    async translateDropdownOption(text) {
        if (this.translatedOptions.has(text)) {
            return this.translatedOptions.get(text);
        }

        try {
            // Only translate from Indonesian to English
            const response = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=' + encodeURIComponent(text));
            const data = await response.json();
            const translatedText = data[0].map(x => x[0]).join('');
            this.translatedOptions.set(text, translatedText);
            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    // Translate dropdown options for audio section
    async translateAudioDropdowns() {
        const dropdowns = [
            'dialog',
            'dialogCharacter',
            'voiceMood',
            'backgroundMusic',
            'soundEffects',
            'volume',
            'audioTranslation'
        ];

        for (const dropdownId of dropdowns) {
            const select = document.getElementById(dropdownId);
            if (select) {
                const options = Array.from(select.options);
                for (const option of options) {
                    if (option.value !== 'none' && option.value !== 'custom') {
                        const translatedText = await this.translateDropdownOption(option.text);
                        option.text = translatedText;
                    }
                }
            }
        }
    }

    // Initialize translations for dropdowns
    async initializeDropdownTranslations() {
        await this.translateAudioDropdowns();
    }

    // Main translation function
    async translateText(text) {
        try {
            // Get translation option from the page
            const audioTranslation = document.getElementById('audioTranslation')?.value || 'none';

            // If full English translation is selected, translate dropdowns
            if (audioTranslation === 'full_english') {
                await this.translateAudioDropdowns();
            }

            // Extract special content
            this.extractSpecialContent(text);

            // Prepare text for translation
            const processedText = this.prepareForTranslation(text);

            // Split text into main content and audio section
            const parts = processedText.split('Audio:');
            const mainContent = parts[0];
            const audioSection = parts[1] || '';

            // Translate main content from Indonesian to English only
            const mainResponse = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=' + encodeURIComponent(mainContent));
            const mainData = await mainResponse.json();
            let translatedText = mainData[0].map(x => x[0]).join('');

            // Handle audio section translation
            if (audioSection) {
                if (audioTranslation === 'full_english') {
                    // Translate the entire audio section from Indonesian to English only
                    const audioResponse = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=' + encodeURIComponent(audioSection));
                    const audioData = await audioResponse.json();
                    const translatedAudio = audioData[0].map(x => x[0]).join('');

                    // Add translated audio section
                    translatedText += '\n\nAudio: ' + translatedAudio;
                } else {
                    // Keep original audio section
                    translatedText += '\n\nAudio: ' + audioSection;
                }
            }

            // Handle dialog translation based on the selected option
            if (audioTranslation === 'full_english') {
                // Translate all dialogs from Indonesian to English only
                for (let dialog of this.specialContent.dialogs) {
                    const dialogResponse = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=en&dt=t&q=' + encodeURIComponent(dialog.text));
                    const dialogData = await dialogResponse.json();
                    dialog.text = dialogData[0].map(x => x[0]).join('');
                }
            }

            // Restore special content
            translatedText = this.restoreSpecialContent(translatedText);

            // Clean up the translated text
            translatedText = this.cleanupTranslatedText(translatedText);

            // Add dangdut koplo background music if not already present
            if (!translatedText.includes('dangdut koplo') && !translatedText.includes('Dangdut Koplo')) {
                const audioSection = translatedText.split('Audio:')[1]?.trim() || '';
                if (audioSection) {
                    const updatedAudioSection = audioSection.replace(
                        /Background music:.*?(?=,|$)/,
                        'Background music: Dangdut Koplo'
                    );
                    translatedText = translatedText.replace(audioSection, updatedAudioSection);
                }
            }

            return translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show success message
            const copyButton = document.getElementById('copyButton');
            if (copyButton) {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '✓ Tersalin!';
                copyButton.classList.add('bg-green-500');
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove('bg-green-500');
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Show error message
            const copyButton = document.getElementById('copyButton');
            if (copyButton) {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '❌ Gagal menyalin';
                copyButton.classList.add('bg-red-500');
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove('bg-red-500');
                }, 2000);
            }
        }
    }

    // Initialize copy button
    initializeCopyButton() {
        const copyButton = document.getElementById('copyButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                const generatedPrompt = document.getElementById('generatedPrompt');
                if (generatedPrompt) {
                    this.copyToClipboard(generatedPrompt.value);
                }
            });
        }
    }
}

// Export the PromptHandler class
export default PromptHandler; 