<?php

/**
 * Парсер документации по mongoDb в пачку файлов.
 */
function getDirContents($dir, &$results = array()){
    $files = scandir($dir);

    foreach($files as $key => $value){
        $path = realpath($dir.DIRECTORY_SEPARATOR.$value);
        if(!is_dir($path)) {
            $results[] = $path;
        } else if($value != "." && $value != "..") {
            getDirContents($path, $results);
            $results[] = $path;
        }
    }

    return $results;
}

$cmd = 'git clone https://github.com/mongodb/docs.git';
exec($cmd);

$files = getDirContents('./docs');
$files = array_filter($files, function($fileName) {
    $info = pathinfo($fileName);
    return (!empty($info['extension']) && $info['extension'] == 'txt');
});
foreach ($files as $file) {
    file_put_contents('../books/mongo_docs.txt', file_get_contents($file), FILE_APPEND);
}
