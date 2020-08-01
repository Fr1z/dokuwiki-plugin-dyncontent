<?php
/**
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)

 */

if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_INC.'inc/common.php');

require_once(DOKU_PLUGIN.'syntax.php');

class syntax_plugin_dyncontent extends DokuWiki_Syntax_Plugin {

    function getInfo(){
        return array(
            'author' => 'Fr1z',
            'email'  => 'franxcava@gmail.com',
            'date'   => '2020-01-08',
            'name'   => 'Dynamic Content Plugin',
            'desc'   => "Write any content once to display it in different wiki pages",
            'url'    => 'http://dokuwiki.org/plugin:dyncontent',
        );
    }


     // What kind of syntax are we?
    function getType(){ return 'formatting'; }

    // What kind of syntax do we allow (optional)
    function getAllowedTypes() {
        return array('formatting', 'substition', 'disabled');
    }
	// What about paragraphs? (optional)
   function getPType(){ return 'normal'; }

    // Where to sort in?
    function getSort(){ return 90; }


    // Connect pattern to lexer
    function connectTo($mode) {
      $this->Lexer->addEntryPattern('(?i)<dyn(?: .+?)?>(?=.+</dyn>)',$mode,'plugin_dyncontent');
    }

    function postConnect() {
      	$this->Lexer->addExitPattern('(?i)</dyn>','plugin_dyncontent');
	}
	
	    // Handle the match
    function handle($match, $state, $pos, Doku_Handler $handler){
        switch ($state) {
          case DOKU_LEXER_ENTER :
            preg_match("/(?i)<dyn (.+?)>/", $match, $pagename); // get the color
            return array($state, $pagename[1]);
            break;
          case DOKU_LEXER_MATCHED :
            break;
          case DOKU_LEXER_UNMATCHED :
            return array($state, $match);
            break;
          case DOKU_LEXER_EXIT :
            break;
          case DOKU_LEXER_SPECIAL :
            break;
        } //$match = substr($match,9,-2);
        return array($state, "");
    }

    // Create output
    function render($mode, Doku_Renderer $renderer, $data) {
        if($mode == 'xhtml'){
          list($state, $contenuto) = $data;
          switch ($state) {
            case DOKU_LEXER_ENTER :
              $renderer->doc .= "<span style=\"border-bottom: 1px dashed #a29b8a;\">";
              break;
            case DOKU_LEXER_MATCHED :
              break;
            case DOKU_LEXER_UNMATCHED :
              $renderer->doc .= $renderer->_xmlEntities($contenuto);
              break;
            case DOKU_LEXER_EXIT :
              $renderer->doc .= "</span>";
              break;
            case DOKU_LEXER_SPECIAL :
              break;
          }
          return true;
        }
        return false;
    }
            


}
