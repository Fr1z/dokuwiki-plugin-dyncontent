<?php
/**
 */

// must be run within Dokuwiki
if(!defined('DOKU_INC')) define('DOKU_INC',realpath(dirname(__FILE__).'/../../').'/');
if(!defined('DOKU_PLUGIN')) define('DOKU_PLUGIN',DOKU_INC.'lib/plugins/');
require_once(DOKU_INC.'inc/fulltext.php');
require_once(DOKU_INC.'inc/pageutils.php');
require_once(DOKU_INC.'inc/common.php');


class action_plugin_dyncontent extends DokuWiki_Action_Plugin {
	
    public function register(Doku_Event_Handler $controller) {
		
       $controller->register_hook('TOOLBAR_DEFINE', 'AFTER', $this, 'insert_button', array());
       $controller->register_hook('PARSER_WIKITEXT_PREPROCESS', 'AFTER', $this, 'handle_parser_wikitext_preprocess');
   
    }
	
	 /**
     * Add list with buttons to toolbar
     *
     * @param Doku_Event $event
     * @param            $param
     */
    public function insert_button(Doku_Event $event, $param) {

		$button = array();
		$ico = '../../plugins/dyncontent/toolbar_ico.png';

        $button[] = 
				array(
                'type'   => 'linkwizv2',
                'title'  => 'Dynamic Content',
                'icon'   => $ico,
				'open' => '<dyn ',
				'close' => '</dyn>',
                'block'  => FALSE
                );
		
		$event->data = array_merge($event->data, $button);
		

    }

	
    public function handle_parser_wikitext_preprocess(Doku_Event &$event, $param) {
        global $INFO;
        if ($INFO['id'] != '') return; 
        $inf = pageinfo();
		$pagename = $inf["id"];
		
		/*
        $inf['namespace'] = urlencode(str_replace(array(' ', '%', '&'), '_', $inf['namespace']));
        $ns = str_replace(':', '/', $inf['namespace']) . '/';
        $base = str_replace('\\', '/', DOKU_INC) . 'data/pages/' . $ns; // 得到文件绝对路径
		*/
		
		$squery = $pagename.'*|'.$pagename.'">"';
		$search = $this->get_search_results($squery);

		if(count($search)){
            foreach($search as $pagid) {
				$dynamic_content .= "\n\n\n\n".$this->get_page_dynamic_content($pagid, $pagename); //the content of entire   
			}
		}
		
        $event->data .= $dynamic_content;
        
    }
	
	function get_search_results($pagename){
		
		$search = ft_pageSearch($pagename,$poswords);
		$search = array_keys($search);
		$search = array_unique($search);
		return $search;
		
    }
	
	function get_page_dynamic_content($page_id, $pagename){
		$content = rawWiki($page_id);
		
		//https://www.phpliveregex.com/#tab-preg-match-all
		/*
		$regex = '/(?<=<dyn ).*?(?=<\/b>)/';
        preg_match_all($regex, $data, $matched);
		*/
		$regex = '/<dyn \s*?.*?'.$pagename.'\s*?.*?>(.*?|[\s\S]*?)<\/dyn>/';
		preg_match_all($regex,$content,$out);		
		
/*
		foreach($out as $match){
			echo json_encode($match);
			echo "<br/>";
			if (!empty($match[0]))
				echo "m0:".$match[0];
			if (!empty($match[1]))
				echo "m1:".$match[1];
			echo "<br/>";
			
		}
		echo "fine page: ".$page_id."<br />";
		*/
		
		foreach($out[1] as $match)
			if (!empty($match))
				$output .= '[['.$page_id.'|→]] '.$match;

		return $output;
	}
	//'<span style=\"background-color: azure; padding: 2px 0px 2px 0px;\">'.

}
