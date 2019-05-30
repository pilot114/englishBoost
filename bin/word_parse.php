<?php

/**
 * Получаем список коротких слов для словаря стоп-слов
 */

$words2 = file_get_contents('https://wordfinder.yourdictionary.com/static-wf/json/word-list/word-length/2.json');
$words3 = file_get_contents('https://wordfinder.yourdictionary.com/static-wf/json/word-list/word-length/3.json');

$words2 = array_column(json_decode($words2, true), 'word');
$words3 = array_column(json_decode($words3, true), 'word');

echo "'" . implode("', '", $words2) . "'\n\n";
echo "'" . implode("', '", $words3) . "'\n\n";
